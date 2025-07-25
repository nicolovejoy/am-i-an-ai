import { Button, PrimaryButton, SecondaryButton, NeonButton, InteractiveButton } from './ui';

export function ButtonShowcase() {
  return (
    <div className="p-8 space-y-8 bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-800">Interactive Button Showcase</h2>
      
      {/* Standard Button with ripple effect */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Enhanced Standard Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Button</Button>
        </div>
      </div>

      {/* Interactive Button Variants */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Premium Interactive Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <PrimaryButton>Gradient Glow</PrimaryButton>
          <SecondaryButton>Minimal Style</SecondaryButton>
          <NeonButton>Neon Magnetic</NeonButton>
        </div>
      </div>

      {/* Custom Interactive Buttons */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Custom Effects</h3>
        <div className="flex flex-wrap gap-4">
          <InteractiveButton
            theme="purple"
            glowEffect
            className="px-6 py-3 font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700"
          >
            Purple Glow
          </InteractiveButton>
          
          <InteractiveButton
            theme="pink"
            magneticEffect
            className="px-6 py-3 font-bold text-pink-600 bg-pink-100 rounded-full hover:bg-pink-200"
          >
            Pink Magnetic
          </InteractiveButton>
          
          <InteractiveButton
            theme="green"
            variant="gradient"
            className="px-6 py-3 font-bold text-white rounded-lg"
          >
            Green Gradient
          </InteractiveButton>
        </div>
      </div>

      {/* Size Variations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Size Variations</h3>
        <div className="flex items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </div>

      {/* Disabled State */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Disabled State</h3>
        <div className="flex gap-4">
          <Button disabled>Disabled Primary</Button>
          <InteractiveButton disabled className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg opacity-50 cursor-not-allowed">
            Disabled Interactive
          </InteractiveButton>
        </div>
      </div>
    </div>
  );
}