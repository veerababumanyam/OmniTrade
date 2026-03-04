/**
 * Footer Component
 * Liquid Glass Design System - OmniTrade
 *
 * Macro-Volume for page footer with Photon Physics and Spatial Volumes.
 * Z-axis: translateZ(0px) (base level)
 */

import {
  forwardRef,
  useState,
  useCallback,
  type FormEvent,
} from 'react';
import { cn } from '../../utils/cn';
import { signalBus } from '../../signal-bus';
import type {
  FooterProps,
  FooterLink,
  SocialLink,
  LegalLink,
  FooterLinkSignalData,
  FooterNewsletterSignalData,
} from './types';

// ============================================
// ICON COMPONENTS (inline for self-containment)
// ============================================

function ExternalLinkIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  );
}

// Social Icons
function TwitterIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
    </svg>
  );
}

function GitHubIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
    </svg>
  );
}

function DiscordIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function TelegramIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function MediumIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
    </svg>
  );
}

function YouTubeIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function RedditIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

// Social icon mapping
const SOCIAL_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  twitter: TwitterIcon,
  linkedin: LinkedInIcon,
  github: GitHubIcon,
  discord: DiscordIcon,
  telegram: TelegramIcon,
  medium: MediumIcon,
  youtube: YouTubeIcon,
  reddit: RedditIcon,
};

// ============================================
// FOOTER COMPONENT
// ============================================

export const Footer = forwardRef<HTMLElement, FooterProps>(function Footer(
  {
    links = [],
    social = [],
    legal = [],
    version,
    copyright,
    logo,
    brandName = 'OmniTrade',
    tagline,
    newsletter,
    children,
    compact = false,
    divider = false,
    className,
    testId,
    aiReadable = true,
  },
  ref
) {
  const [email, setEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  // Handlers
  const handleLinkClick = useCallback(
    (link: FooterLink, columnId?: string) => {
      // Emit signal
      const signalData: FooterLinkSignalData = {
        link,
        columnId,
        category: columnId ? 'navigation' : 'navigation',
      };
      signalBus.publish('ui:footer:link', signalData, { source: 'Footer' });

      if (link.onClick) {
        link.onClick();
      }
    },
    []
  );

  const handleSocialClick = useCallback((socialLink: SocialLink) => {
    // Emit signal
    const signalData: FooterLinkSignalData = {
      link: socialLink as FooterLink,
      category: 'social',
    };
    signalBus.publish('ui:footer:link', signalData, { source: 'Footer' });
  }, []);

  const handleLegalClick = useCallback((legalLink: LegalLink) => {
    // Emit signal
    const signalData: FooterLinkSignalData = {
      link: legalLink as FooterLink,
      category: 'legal',
    };
    signalBus.publish('ui:footer:link', signalData, { source: 'Footer' });
  }, []);

  const handleNewsletterSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!email.trim() || !newsletter?.onSubmit) return;

      try {
        await newsletter.onSubmit(email);
        setNewsletterSuccess(true);

        // Emit signal
        const signalData: FooterNewsletterSignalData = {
          email,
          success: true,
        };
        signalBus.publish('ui:footer:newsletter', signalData, { source: 'Footer' });

        // Reset after delay
        setTimeout(() => {
          setNewsletterSuccess(false);
          setEmail('');
        }, 3000);
      } catch {
        // Emit failure signal
        const signalData: FooterNewsletterSignalData = {
          email,
          success: false,
        };
        signalBus.publish('ui:footer:newsletter', signalData, { source: 'Footer' });
      }
    },
    [email, newsletter]
  );

  // Default copyright
  const defaultCopyright = copyright || `\u00A9 ${new Date().getFullYear()} ${brandName}. All rights reserved.`;

  // Default logo
  const defaultLogo = (
    <div className={styles.brandLogo}>
      <div className={styles.brandLogoIcon}>
        <svg viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="footer-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--ot-brand-primary-500, #0070f3)" />
              <stop offset="100%" stopColor="var(--ot-brand-accent-500, #8b5cf6)" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="14" stroke="url(#footer-logo-gradient)" strokeWidth="2" fill="none" />
          <path
            d="M10 16l4 4 8-8"
            stroke="url(#footer-logo-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      <span className={styles.brandLogoText}>{brandName}</span>
    </div>
  );

  return (
    <footer
      ref={ref}
      className={cn(styles.footer, divider && styles.footerWithDivider, className)}
      data-testid={testId}
      {...(aiReadable && { 'data-ai-footer': 'true' })}
    >
      <div className={cn(styles.footerInner, compact && styles.footerInnerCompact)}>
        {/* Top Section: Brand & Newsletter */}
        {!compact && (
          <div className={styles.footerTop}>
            <div className={styles.brandSection}>
              {logo || defaultLogo}
              {tagline && <p className={styles.brandTagline}>{tagline}</p>}
            </div>

            {newsletter?.enabled !== false && newsletter?.onSubmit && (
              <div className={styles.newsletter}>
                <span className={styles.newsletterTitle}>
                  {newsletter.title || 'Subscribe to our newsletter'}
                </span>
                {newsletterSuccess ? (
                  <span className={styles.newsletterSuccess}>
                    {newsletter.successMessage || 'Thanks for subscribing!'}
                  </span>
                ) : (
                  <form className={styles.newsletterForm} onSubmit={handleNewsletterSubmit}>
                    <input
                      type="email"
                      className={styles.newsletterInput}
                      placeholder={newsletter.placeholder || 'Enter your email'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      {...(aiReadable && { 'data-ai-newsletter-input': 'true' })}
                    />
                    <button type="submit" className={styles.newsletterButton}>
                      {newsletter.submitLabel || 'Subscribe'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main Section: Links & Social */}
        <div className={cn(styles.footerMain, compact && styles.footerMainCompact)}>
          {/* Link Columns */}
          {links.length > 0 && (
            <div className={styles.linksContainer}>
              {links.map((column) => (
                <div
                  key={column.id}
                  className={styles.linkColumn}
                  {...(aiReadable && { 'data-ai-footer-section': column.id })}
                >
                  {column.title && (
                    <h4 className={styles.linkColumnTitle}>{column.title}</h4>
                  )}
                  <ul className={styles.linkList}>
                    {column.links.map((link) => (
                      <li key={link.id} className={styles.linkItem}>
                        <a
                          href={link.href}
                          className={cn(
                            styles.link,
                            link.disabled && styles.linkDisabled
                          )}
                          onClick={(e) => {
                            if (!link.href || link.href === '#') {
                              e.preventDefault();
                            }
                            handleLinkClick(link, column.id);
                          }}
                          target={link.external ? '_blank' : undefined}
                          rel={link.external ? 'noopener noreferrer' : undefined}
                          {...(aiReadable && { 'data-ai-link-id': link.id })}
                        >
                          {link.icon && <link.icon size={16} className={styles.linkIcon} />}
                          <span>{link.label}</span>
                          {link.external && <ExternalLinkIcon size={12} />}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Social Links */}
          {social.length > 0 && (
            <div className={styles.socialSection}>
              <span className={styles.socialLabel}>Follow us</span>
              <div className={styles.socialLinks}>
                {social.map((socialLink) => {
                  const IconComponent = socialLink.icon || SOCIAL_ICONS[socialLink.platform];
                  return (
                    <a
                      key={socialLink.id}
                      href={socialLink.href}
                      className={styles.socialLink}
                      onClick={() => handleSocialClick(socialLink)}
                      target={socialLink.external !== false ? '_blank' : undefined}
                      rel={socialLink.external !== false ? 'noopener noreferrer' : undefined}
                      aria-label={socialLink.label}
                      {...(aiReadable && { 'data-ai-social-id': socialLink.id })}
                    >
                      {IconComponent && <IconComponent size={18} />}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Copyright, Version, Legal */}
        <div className={styles.footerBottom}>
          <div className="flex items-center gap-4">
            <span className={styles.copyright}>{defaultCopyright}</span>
            {version && (
              <span className={styles.version} {...(aiReadable && { 'data-ai-version': version })}>
                v{version}
              </span>
            )}
          </div>

          {/* Legal Links */}
          {legal.length > 0 && (
            <ul className={styles.legalLinks}>
              {legal.map((legalLink) => (
                <li key={legalLink.id}>
                  <a
                    href={legalLink.href}
                    className={styles.legalLink}
                    onClick={(e) => {
                      if (!legalLink.href || legalLink.href === '#') {
                        e.preventDefault();
                      }
                      handleLegalClick(legalLink);
                    }}
                    {...(aiReadable && { 'data-ai-legal-id': legalLink.id })}
                  >
                    {legalLink.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Custom Content */}
        {children}
      </div>
    </footer>
  );
});

export default Footer;

// CSS module styles mapping
const styles = {
  footer: 'footer',
  footerWithDivider: 'footerWithDivider',
  footerInner: 'footerInner',
  footerInnerCompact: 'footerInnerCompact',
  footerTop: 'footerTop',
  brandSection: 'brandSection',
  brandLogo: 'brandLogo',
  brandLogoIcon: 'brandLogoIcon',
  brandLogoText: 'brandLogoText',
  brandTagline: 'brandTagline',
  newsletter: 'newsletter',
  newsletterTitle: 'newsletterTitle',
  newsletterForm: 'newsletterForm',
  newsletterInput: 'newsletterInput',
  newsletterButton: 'newsletterButton',
  newsletterSuccess: 'newsletterSuccess',
  footerMain: 'footerMain',
  footerMainCompact: 'footerMainCompact',
  linksContainer: 'linksContainer',
  linkColumn: 'linkColumn',
  linkColumnTitle: 'linkColumnTitle',
  linkList: 'linkList',
  linkItem: 'linkItem',
  link: 'link',
  linkIcon: 'linkIcon',
  linkDisabled: 'linkDisabled',
  socialSection: 'socialSection',
  socialLabel: 'socialLabel',
  socialLinks: 'socialLinks',
  socialLink: 'socialLink',
  footerBottom: 'footerBottom',
  copyright: 'copyright',
  version: 'version',
  legalLinks: 'legalLinks',
  legalLink: 'legalLink',
};
