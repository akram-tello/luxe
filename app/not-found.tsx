import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <p className="label">404</p>
        <h1 className="font-serif text-4xl mt-3">Not found</h1>
        <p className="text-sm text-bone/50 mt-4">
          The record you are looking for could not be located, or you do not have access to it.
        </p>
        <div className="hairline mt-8 mb-8" />
        <Link href="/" className="btn-primary">
          Return home
        </Link>
      </div>
    </div>
  );
}
