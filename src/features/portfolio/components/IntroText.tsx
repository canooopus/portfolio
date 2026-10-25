import { Image } from "@/components/common/Image";
import Link from "next/link";

interface IntroTextProps {
  novaMonoClass: string;
}

export function IntroText({ novaMonoClass }: IntroTextProps) {
  return (
    <div className="space-y-8 w-full">
      <p>
        I’m Canooopus, an engineer & designer living in Japan. I just build what
        I want to build independently.
      </p>

      <p>
        I’m currently working on
        <Link
          href="https://robopro2.com/app/nagasima/LINE/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 align-middle ml-1 mb-1 hover:opacity-80 transition-opacity underline decoration-1 underline-offset-2"
        >
          <span className="h-[1em] w-[1em] flex items-center">
            <Image
              src="/images/brand/Bond.svg"
              alt=""
              width={100}
              height={100}
              priority
              className="w-full h-full object-contain"
            />
          </span>
          <span className={novaMonoClass}>Bond</span>
        </Link>
        , a browser-based chat app.
      </p>
      <p>
        In my free time, I enjoy photography, exploring new gadgets, and I
        absolutely love{" "}
        <Link
          href="https://radwimps.jp/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity underline decoration-1 underline-offset-2"
        >
          RADWIMPS
        </Link>
        .
      </p>
    </div>
  );
}
