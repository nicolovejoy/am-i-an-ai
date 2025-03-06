import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        {/* Dog photo container */}
        <div className="mb-6 bg-medium-blue p-4 border border-neon-blue rounded-lg flex flex-col items-center justify-center">
          {/* Replace the div below with an img tag when you have your dog photo */}
          {/* Example: }
          <img 
            src="/images/your-dog-photo.jpg" 
            alt="A dog looking confused" 
            className="w-full max-w-md rounded-md"
          />
          */}
          <img
            src="/dog-or-cat.jpg"
            alt="A dog looking confused"
            className="w-full max-w-md rounded-md"
          />
          {/* <p className="text-sm text-gray-400 mt-2 font-mono">
            <span className="text-neon-blue">&gt;</span> Dog photo loaded from public root
          </p> */}
        </div>

        {/* Quote */}
        <div className="terminal p-6">
          <blockquote className="text-xl sm:text-2xl font-mono leading-relaxed mb-4">
            <span className="text-neon-blue">"</span>
            <span className="text-neon-pink">Am I a Dog? Or a Cat?</span>{' '}
            <span className="text-white">on the internet, nobody</span>{' '}
            <span className="text-neon-purple">nose.</span>
            <span className="text-neon-blue">"</span>
          </blockquote>
          <cite className="text-neon-green block text-right font-mono">— Fritzy Kitty</cite>
        </div>
      </div>
    </div>
  );
};

export default Home;
