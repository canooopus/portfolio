import Image from 'next/image';
import Link from 'next/link';
import { Nova_Mono } from 'next/font/google'; 

const novaMono = Nova_Mono({
  subsets: ['latin'],
  weight: '400'
});

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-20 md:py-32 selection:bg-blue-100 flex flex-col items-start justify-center min-h-[50vh]">
      {/* ロゴセクション */}
      <div className="mb-12 w-full max-w-[240px] md:max-w-[300px]">
        <Image 
          src="/logo.svg" 
          alt="ロゴ" 
          width={300} 
          height={88} 
          priority
          className="w-full h-auto"
        />
      </div>

      {/* テキストセクション */}
      <div className="space-y-8 w-full">
        <p>
          I’m <span className="font-semibold">Canooopus</span>, an engineer & designer living in Japan. 
          I just build what I want to build independently.
        </p>
        
        <p>
          I’m currently working on 
          <Link href="https://robopro2.com/app/nagasima/LINE/" className="inline-flex items-center gap-1 align-middle ml-1 mb-1 hover:opacity-80 transition-opacity">
            <span className="h-[1em] w-[1em] flex items-center">
              <Image 
                src="/Bond.svg" 
                alt="ロゴ" 
                width={100} 
                height={100}
                priority
                className="w-full h-full object-contain"
              />
            </span>
            <span className={`text-[#2cca95] ${novaMono.className}`}>Bond</span>
          </Link>
          , a browser-based chat app.
        </p> 

        <p>
          In my free time, I enjoy photography, exploring new gadgets, and I absolutely love RADWIMPS.
        </p>
      </div>
    </main>
  );
}