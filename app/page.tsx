import Image from 'next/image';

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-20 md:py-32 selection:bg-blue-100">
      {/* ロゴセクション */}
      <div className="mb-12 max-w-[240px] md:max-w-[300px]">
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
      <div className="space-y-8 max-w-2xl">
        <p>
          I’m <span className="font-semibold">Canooopus</span>, an engineer & designer living in Japan. 
          I just build what I want to build independently.
        </p>
        
        <p>
          I’m currently working on <span className="text-[#2cca95] font-medium">Bond</span>, 
          a browser-based chat app.
        </p> 
      </div>
    </main>
  );
}