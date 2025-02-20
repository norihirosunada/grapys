import { useState } from "react";
import { GraphData } from "graphai";
import { graphChat as graphChatOpenAI } from "../graph/chat";
import { graphChat as graphChatTinySwallow } from "../graph/chat_tinyswallow";

const graphs = [
  { name: "Chat(WebLLM)", graph: graphChatTinySwallow },
  { name: "Chat(OpenAI)", graph: graphChatOpenAI },
];

interface GraphSelectorProps {
  onSetGraph: (graph: GraphData) => void;
}

const TemplateGraph: React.FC<GraphSelectorProps> = ({ onSetGraph }) => {
  const [template, setTemplate] = useState(0);

  const setGraph = () => {
    onSetGraph(graphs[template].graph);
  };

  return (
    <div>
      <b>Graph Template</b>
      <select
        className="mt-2 w-full resize-none rounded-md border-2 border-gray-300 p-1 text-black"
        value={template}
        onChange={(e) => setTemplate(Number(e.target.value))}
      >
        {graphs.map((graph, k) => (
          <option key={k} value={k}>
            {graph.name}
          </option>
        ))}
      </select>
      <div>
        <button onClick={setGraph} className="m-1 items-center rounded-full bg-sky-500 px-4 py-2 font-bold text-white hover:bg-sky-700">
          Set Graph
        </button>
      </div>
    </div>
  );
};

export default TemplateGraph;
