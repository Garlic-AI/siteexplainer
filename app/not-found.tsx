import Link from "next/link";
import { SiteHeader } from "./_components/site-header";
import { Footer } from "./_components/footer";
import { UrlForm } from "./_components/url-form";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-xl py-20 text-center">
          <p className="font-mono text-sm text-faint">404</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            That's not a website we can explain
          </h1>
          <p className="mt-3 text-muted">
            Paste a real URL like <span className="font-mono text-ink">vercel.com</span> and
            we'll tell you what it does.
          </p>
          <div className="mt-8 text-left">
            <UrlForm size="hero" />
          </div>
          <Link
            href="/"
            className="mt-6 inline-flex text-sm text-muted underline transition-colors hover:text-ink"
          >
            ← Back home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
