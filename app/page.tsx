import Image from 'next/image';

export default function Home() {
  return (
    <main>
      <Image src="/logo.svg" alt="ロゴ" width={200} height={200} className='w-1/2 mx-auto'/>
      <div className="w-1/2 mx-auto">
        <p className="text-base">
          I’m canooopus, an engineer & designer living in Japan. I just build what I want to build independently.
        </p>  
      </div> 
    </main>
  );
}