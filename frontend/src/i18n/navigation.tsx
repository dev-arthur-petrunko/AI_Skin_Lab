import { locales } from "./config";

export const Link = (props: { href: string; children: React.ReactNode; className?: string }) => (
  <a href={props.href} className={props.className}>{props.children}</a>
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
