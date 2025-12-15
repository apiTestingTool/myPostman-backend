import { Status } from '../config';
import { ValidationResult, ParsedUrl } from '../config/types';

export class UrlValidationService {
  private static readonly ALLOWED_PROTOCOLS = ['http:', 'https:'];
  private static readonly MAX_URL_LENGTH = 2048;
  private static readonly LOCALHOST_ALIASES = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];

  // Block private/internal IP ranges
  private static readonly PRIVATE_IP_RANGES = [
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12
    /^192\.168\.\d{1,3}\.\d{1,3}$/, // 192.168.0.0/16
    /^169\.254\.\d{1,3}\.\d{1,3}$/, // Link-local
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/ // Loopback
  ];

  // Dangerous or restricted TLDs
  private static readonly RESTRICTED_TLDS = ['.local', '.internal', '.localhost', '.test', '.example', '.invalid', '.localhost.localdomain'];

  // Blocked protocols/schemes
  private static readonly BLOCKED_PROTOCOLS = ['file:', 'ftp:', 'mailto:', 'javascript:', 'data:', 'ws:', 'wss:'];

  // Main validation method
  static validateRequestUrl(requestUrl: string, allowLocalhost: boolean = process.env.NODE_ENV === 'development'): ValidationResult {
    try {
      // 1. Basic type and presence check
      const basicCheck = this.validateBasic(requestUrl);
      if (!basicCheck.valid) return basicCheck;
      console.log('Basic validation passed');

      // 2. Normalize URL (add protocol if missing)
      const { normalizedUrl, protocolAdded } = this.normalizeUrl(requestUrl.trim());
      console.log(`Normalized URL: ${normalizedUrl} ${protocolAdded ? '(protocol added)' : ''}`);

      // 3. Parse and validate URL structure
      const parsedUrl = new URL(normalizedUrl);
      console.log('URL parsed successfully:', parsedUrl.href);

      // 4. Protocol validation
      const protocolCheck = this.validateProtocol(parsedUrl);
      if (!protocolCheck.valid) return protocolCheck;
      console.log('Protocol validation passed:', parsedUrl.protocol);

      // 5. Hostname validation
      const hostnameCheck = this.validateHostname(parsedUrl.hostname, allowLocalhost);
      if (!hostnameCheck.valid) return hostnameCheck;
      console.log('Hostname validation passed:', parsedUrl.hostname);

      // 6. Port validation
      const portCheck = this.validatePort(parsedUrl.port);
      if (!portCheck.valid) return portCheck;
      console.log('Port validation passed:', parsedUrl.port || 'default');

      // 7. Path validation (prevent path traversal)
      const pathCheck = this.validatePath(parsedUrl.pathname);
      if (!pathCheck.valid) return pathCheck;
      console.log('Path validation passed:', parsedUrl.pathname);

      // 8. Query string validation
      const queryCheck = this.validateQuery(parsedUrl.search);
      if (!queryCheck.valid) return queryCheck;
      console.log('Query string validation passed');

      // 9. Final URL sanitization
      const sanitizedUrl = this.sanitizeUrl(parsedUrl);
      console.log('Sanitized URL:', sanitizedUrl);

      // 10. Additional security checks
      const securityCheck = this.securityChecks(parsedUrl, allowLocalhost);
      if (!securityCheck.valid) return securityCheck;
      console.log('Additional security checks passed');

      return {
        valid: true,
        meta: {
          status: Status.SUCCESS,
          message: 'requestUrl is valid'
        },
        data: {
          status: Status.SUCCESS,
          message: 'URL is valid',
          details: {
            original: requestUrl,
            normalized: normalizedUrl,
            protocolAdded,
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 'default',
            path: parsedUrl.pathname || '/'
          }
        }
      };
    } catch (error) {
      console.log('Error during URL validation:', error);
      return { valid: false, meta: { status: Status.FAILED, message: 'Invalid URL format' } };
    }
  }

  // Basic validation
  private static validateBasic(requestUrl: any): ValidationResult {
    // Check if exists
    if (requestUrl === undefined || requestUrl === null) {
      return {
        valid: false,
        meta: {
          status: Status.FAILED,
          message: 'requestUrl is required'
        }
      };
    }

    // Check type
    if (typeof requestUrl !== 'string') {
      return {
        valid: false,
        meta: {
          status: Status.FAILED,
          message: 'requestUrl must be a string'
        }
      };
    }

    // Check empty string
    const trimmed = requestUrl.trim();
    if (trimmed.length === 0) {
      return {
        valid: false,
        meta: {
          status: Status.FAILED,
          message: 'requestUrl cannot be empty'
        }
      };
    }

    // Check length
    if (trimmed.length > this.MAX_URL_LENGTH) {
      return {
        valid: false,
        meta: {
          status: Status.FAILED,
          message: `requestUrl exceeds maximum length of ${this.MAX_URL_LENGTH} characters`
        }
      };
    }

    return {
      valid: true,
      meta: {
        status: Status.SUCCESS,
        message: 'Basic validation passed'
      }
    };
  }

  // Normalize URL
  private static normalizeUrl(url: string): { normalizedUrl: string; protocolAdded: boolean } {
    let normalizedUrl = url;
    let protocolAdded = false;

    // Remove any leading/trailing whitespace
    normalizedUrl = normalizedUrl.trim();

    // Check if protocol is present
    const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(normalizedUrl);

    if (!hasProtocol) {
      // Check if it starts with // (protocol-relative URL)
      if (normalizedUrl.startsWith('//')) {
        normalizedUrl = 'https:' + normalizedUrl;
        protocolAdded = true;
      } else {
        // Add https:// by default (more secure than http://)
        normalizedUrl = 'https://' + normalizedUrl;
        protocolAdded = true;
      }
    }

    // Ensure proper formatting
    normalizedUrl = normalizedUrl.replace(/^http:\/\/(?!\/)/, 'http://');
    normalizedUrl = normalizedUrl.replace(/^https:\/\/(?!\/)/, 'https://');

    return {
      normalizedUrl,
      protocolAdded
    };
  }

  // Protocol validation
  private static validateProtocol(parsedUrl: URL): ValidationResult {
    // Check blocked protocols
    if (this.BLOCKED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return {
        valid: false,
        meta: {
          status: Status.FAILED,
          message: `Protocol "${parsedUrl.protocol}" is not allowed`
        }
      };
    }

    // Check if protocol is allowed
    if (!this.ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return {
        valid: false,
        meta: {
          status: Status.FAILED,
          message: `Protocol "${parsedUrl.protocol}" is not supported. Only HTTP and HTTPS are allowed.`
        }
      };
    }

    return {
      valid: true,
      meta: {
        status: Status.SUCCESS,
        message: 'Protocol validation passed'
      }
    };
  }

  // Hostname validation
  private static validateHostname(hostname: string, allowLocalhost: boolean): ValidationResult {
    // Check if hostname exists
    if (!hostname || hostname.length === 0) {
      return {
        valid: false,
        meta: {
          status: Status.FAILED,
          message: 'Hostname is required in the URL'
        }
      };
    }

    // Check for restricted TLDs
    const isRestrictedTLD = this.RESTRICTED_TLDS.some((tld) => hostname.toLowerCase().endsWith(tld.toLowerCase()));

    if (isRestrictedTLD) {
      return {
        valid: false,
        meta: {
          status: Status.FAILED,
          message: 'URL contains restricted domain suffix'
        }
      };
    }

    // Check for localhost/private IP (based on environment)
    if (!allowLocalhost) {
      const isLocalhost = this.LOCALHOST_ALIASES.includes(hostname.toLowerCase());
      if (isLocalhost) {
        return {
          valid: false,
          meta: {
            status: Status.FAILED,
            message: 'Localhost URLs are not allowed in production'
          }
        };
      }

      // Check for private IP ranges
      const isPrivateIP = this.PRIVATE_IP_RANGES.some((regex) => regex.test(hostname));
      if (isPrivateIP) {
        return {
          valid: false,
          meta: {
            status: Status.FAILED,
            message: 'Private/internal IP addresses are not allowed'
          }
        };
      }
    }

    // Validate hostname format
    if (!this.isValidHostnameFormat(hostname)) {
      return {
        valid: false,
        meta: {
          status: Status.FAILED,
          message: 'Invalid hostname format'
        }
      };
    }

    return { valid: true, meta: { status: Status.SUCCESS, message: '' } };
  }

  // Port validation
  private static validatePort(port: string): ValidationResult {
    if (!port) {
      return { valid: true, meta: { status: Status.SUCCESS, message: 'Port is mandatory' } };
    }

    const portNum = parseInt(port, 10);

    // Check if port is a valid number
    if (isNaN(portNum)) {
      return {
        valid: false,
        meta: {
          status: Status.FAILED,
          message: 'Port must be a valid number'
        }
      };
    }

    // Check port range
    if (portNum < 1 || portNum > 65535) {
      return {
        valid: false,
        meta: {
          status: Status.FAILED,
          message: 'Port must be between 1 and 65535'
        }
      };
    }

    // Check for common restricted ports
    const restrictedPorts = [0, 25, 137, 138, 139, 445];
    if (restrictedPorts.includes(portNum)) {
      return {
        valid: false,
        meta: {
          status: Status.FAILED,
          message: `Port ${portNum} is restricted`
        }
      };
    }

    return { valid: true, meta: { status: Status.SUCCESS, message: 'Port validation passed' } };
  }

  // Path validation
  private static validatePath(pathname: string): ValidationResult {
    if (!pathname || pathname === '/') {
      return { valid: true, meta: { status: Status.SUCCESS, message: 'Path validation passed' } };
    }

    // Check for path traversal attacks
    const normalizedPath = pathname.replace(/\/+/g, '/');
    if (normalizedPath.includes('/../') || normalizedPath.endsWith('/..')) {
      return {
        valid: false,
        meta: {
          status: Status.FAILED,
          message: 'URL contains path traversal attempt'
        }
      };
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /\.\.$/, // ends with ..
      /\/\.\.\//, // contains /../
      /\/\.$/, // ends with /.
      /\/\.\//, // contains /./
      /[<>:"|?*]/, // invalid characters
      /%2e%2e/i, // URL encoded ..
      /%2e\./i // URL encoded .
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(pathname) || pattern.test(decodeURIComponent(pathname))) {
        return {
          valid: false,
          meta: {
            status: Status.FAILED,
            message: 'URL path contains invalid or dangerous patterns'
          }
        };
      }
    }

    return { valid: true, meta: { status: Status.SUCCESS, message: 'Path validation passed' } };
  }

  // Query string validation
  private static validateQuery(search: string): ValidationResult {
    if (!search || search.length <= 1) {
      // "?" is length 1
      return { valid: true, meta: { status: Status.SUCCESS, message: 'No query string to validate' } };
    }

    // Check query length
    if (search.length > 1000) {
      return {
        valid: false,
        meta: {
          status: Status.FAILED,
          message: 'Query string is too long'
        }
      };
    }

    // Check for potentially dangerous query parameters
    const dangerousParams = [/<script/i, /javascript:/i, /onload=/i, /onerror=/i, /onclick=/i];

    const queryString = search.toLowerCase();
    for (const pattern of dangerousParams) {
      if (pattern.test(queryString)) {
        return {
          valid: false,
          meta: {
            status: Status.FAILED,
            message: 'Query string contains potentially dangerous content'
          }
        };
      }
    }

    return { valid: true, meta: { status: Status.SUCCESS, message: 'Query string validation passed' } };
  }

  //  URL sanitization
  private static sanitizeUrl(parsedUrl: URL): string {
    // Reconstruct URL with proper encoding
    let sanitized = parsedUrl.protocol + '//';

    // Sanitize hostname (lowercase)
    sanitized += parsedUrl.hostname.toLowerCase();

    // Add port if present
    if (parsedUrl.port) {
      sanitized += ':' + parsedUrl.port;
    }

    // Sanitize pathname (proper encoding)
    sanitized += encodeURI(decodeURIComponent(parsedUrl.pathname));

    // Keep query and hash as-is (they should already be encoded)
    sanitized += parsedUrl.search;
    sanitized += parsedUrl.hash;

    return sanitized;
  }

  // Additional security checks
  private static securityChecks(parsedUrl: URL, allowLocalhost: boolean): ValidationResult {
    // Check for encoded characters that might bypass validation
    const doubleEncoded = /%25[0-9a-f]{2}/i.test(parsedUrl.href);
    if (doubleEncoded) {
      return {
        valid: false,
        meta: {
          status: Status.FAILED,
          message: 'URL contains double-encoded characters'
        }
      };
    }

    // Check for NULL bytes (can be used in injection attacks)
    if (parsedUrl.href.includes('\0') || parsedUrl.href.includes('%00')) {
      return {
        valid: false,
        meta: {
          status: Status.FAILED,
          message: 'URL contains NULL bytes'
        }
      };
    }

    // Check for excessive dots in domain
    const dotCount = (parsedUrl.hostname.match(/\./g) || []).length;
    if (dotCount > 5) {
      // Excessive subdomains might be suspicious
      return {
        valid: false,
        meta: {
          status: Status.FAILED,
          message: 'URL contains too many subdomains'
        }
      };
    }

    return { valid: true, meta: { status: Status.SUCCESS, message: 'Security checks passed' } };
  }

  // Helper: Check hostname format
  private static isValidHostnameFormat(hostname: string): boolean {
    // IPv4 validation
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv4Match = hostname.match(ipv4Regex);

    if (ipv4Match) {
      // Validate each octet
      for (let i = 1; i <= 4; i++) {
        const octet = parseInt(ipv4Match[i], 10);
        if (octet < 0 || octet > 255) {
          return false;
        }
      }
      return true;
    }

    // IPv6 validation (simplified)
    const ipv6Regex = /^\[[a-fA-F0-9:]+\]$/;
    if (ipv6Regex.test(hostname)) {
      return true;
    }

    // Domain name validation
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(hostname);
  }

  //  Parse URL into components (for debugging/logging)
  static parseUrl(url: string): ParsedUrl | ValidationResult {
    try {
      const parsed = new URL(url);

      return {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || null,
        pathname: parsed.pathname,
        search: parsed.search || null,
        hash: parsed.hash || null,
        origin: parsed.origin,
        fullUrl: parsed.href
      };
    } catch (err) {
      return { valid: false, meta: { status: Status.FAILED, message: 'Invalid URL format' } };
    }
  }

  /**
   * Quick validation (simplified version)
   */
  static quickValidate(url: string): boolean {
    try {
      const parsed = new URL(url);
      return this.ALLOWED_PROTOCOLS.includes(parsed.protocol) && !!parsed.hostname && parsed.hostname.length > 0;
    } catch {
      return false;
    }
  }
}
