export const Link = ({
  href,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
  <a href={href} {...rest}>{children}</a>
);

export const redirect = (href: string) => {
  if (typeof window !== 'undefined') {
    window.location.href = href;
  }
};

export const usePathname = () => {
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }
  return '/';
};

export const useRouter = () => ({
  push: (href: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  },
  replace: (href: string) => {
    if (typeof window !== 'undefined') {
      window.location.replace(href);
    }
  },
});
