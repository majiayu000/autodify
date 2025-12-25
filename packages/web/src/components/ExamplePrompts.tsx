import { memo } from 'react';
import { EXAMPLE_PROMPTS } from '../constants/nodeConfig';

interface ExamplePromptsProps {
  onExampleClick: (example: string) => void;
}

const ExamplePrompts = memo(function ExamplePrompts({ onExampleClick }: ExamplePromptsProps) {
  return (
    <div className="examples">
      <h3>💡 示例</h3>
      {EXAMPLE_PROMPTS.map((example, index) => (
        <button key={index} className="example-btn" onClick={() => onExampleClick(example)}>
          {example}
        </button>
      ))}
    </div>
  );
});

export default ExamplePrompts;
