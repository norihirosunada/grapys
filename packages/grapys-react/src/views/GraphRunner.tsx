import React, { useState, useEffect, useCallback, useRef } from "react";
import { GraphAI, GraphData } from "graphai";
import * as agents from "@graphai/vanilla";
import { openAIAgent } from "@graphai/openai_agent";
import { geminiAgent } from "@graphai/gemini_agent";
import { anthropicAgent } from "@graphai/anthropic_agent";
import { browserlessAgent } from "@graphai/browserless_agent";

import tinyswallowAgent, { modelLoad, loadEngine, CallbackReport } from "../agents/tinyswallow";
import { codeRunnerAgent } from "../agents/code_runner";
import { useTextInputEvent } from "../agents/event_react";
import { useLocalStore } from "../store";
import { useStreamData } from "../utils/react-plugin/stream";
import { useChatPlugin } from "../utils/react-plugin/chat";

import { getGraphConfigs } from "../graph";
import { GUIMessage } from "../utils/gui/type";

const GraphRunner: React.FC<{ graphData: GraphData }> = ({ graphData }) => {
  const [isRunning, setIsRunning] = useState(false);
  const streamNodes = useLocalStore((state) => state.streamNodes);
  const resultNodes = useLocalStore((state) => state.resultNodes);
  const currentData = useLocalStore((state) => state.currentData);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  // チャットUIの開閉状態を管理
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    loadEngine();
  }, []);

  const { eventAgent, userInput, setUserInput, events, submitText } = useTextInputEvent();
  const { messages, chatMessagePlugin } = useChatPlugin();
  const { streamData, streamAgentFilter, streamPlugin, isStreaming } = useStreamData();

  const agentFilters = [
    {
      name: "streamAgentFilter",
      agent: streamAgentFilter,
    },
  ];

  const [loading, setLoading] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    modelLoad((report: CallbackReport) => {
      if (report.progress === 1) {
        setReady(true);
      }
      setLoading(report.text);
      console.log(report.text);
    });
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, streamData]);

  const [graphai, setGraphai] = useState<GraphAI | null>(null);
  const run = useCallback(async () => {
    setIsRunning(true);
    // チャットを開始したら自動的にUIを開く
    setIsChatOpen(true);
    const graphDataWithMeta = { ...graphData, metadata: { ...(graphData.metadata ?? {}), data: currentData } };

    const graph = new GraphAI(
      graphDataWithMeta,
      {
        ...agents,
        openAIAgent,
        anthropicAgent,
        geminiAgent,
        eventAgent,
        tinyswallowAgent,
        browserlessAgent,
        codeRunnerAgent,
      },
      {
        agentFilters,
        config: getGraphConfigs(),
      },
    );
    graph.registerCallback(streamPlugin(streamNodes()));
    graph.registerCallback(chatMessagePlugin(resultNodes()));
    setGraphai(graph);
    try {
      await graph.run();
      setIsRunning(false);
    } catch (error) {
      console.log(error);
    }
  }, [eventAgent, streamPlugin, chatMessagePlugin, graphData, streamNodes, currentData, resultNodes]);

  const abort = useCallback(() => {
    try {
      if (isRunning && graphai) {
        graphai.abort();
        setGraphai(null);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsRunning(false);
    }
  }, [graphai, isRunning]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && events.length > 0) {
      submitText(events[0]);
    }
  };

  const renderChatMessages = () => {
    const streamNodeIds = streamNodes();
    return (
      <>
        {messages.map((m: GUIMessage, k: number) => (
          <div key={k} className={`mb-4 ${m.role === "user" ? "text-right" : "text-left"}`}>
            <div className={`inline-block max-w-[80%] rounded-lg px-4 py-2 ${m.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}>
              <div className="mb-1 text-sm font-semibold">{m.role === "user" ? "You" : `AI (${m.nodeId})`}</div>
              <div className="break-words whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        {streamNodeIds.map((nodeId, k) => (
          <div key={`stream-${k}`} className="mb-4 text-left">
            {isStreaming[nodeId] && (
              <div className="inline-block max-w-[80%] rounded-lg bg-gray-200 px-4 py-2 text-gray-800">
                <div className="mb-1 text-sm font-semibold">AI ({nodeId})</div>
                <div className="break-words whitespace-pre-wrap">{streamData[nodeId]}</div>
              </div>
            )}
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="pointer-events-auto flex w-100 flex-col">
      {/* Chat header */}
      <div
        className="flex cursor-pointer items-center justify-between rounded-t-lg border border-gray-300 bg-gray-100 p-3"
        onClick={() => setIsChatOpen(!isChatOpen)}
      >
        <div className="flex items-center font-bold">
          <span>Chat</span>
          {messages.length > 0 && <span className="ml-2 rounded-full bg-blue-500 px-2 py-1 text-xs text-white">{messages.length}</span>}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              run();
            }}
            className={`rounded-md px-3 py-1 font-medium text-white ${isRunning ? "cursor-not-allowed bg-gray-400" : "bg-green-500 hover:bg-green-600"}`}
            disabled={isRunning}
          >
            {ready ? "Run" : "Loading..."}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              abort();
            }}
            className={`rounded-md px-3 py-1 font-medium text-white ${!isRunning ? "cursor-not-allowed bg-gray-400" : "bg-red-500 hover:bg-red-600"}`}
            disabled={!isRunning}
          >
            Stop
          </button>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform duration-300 ${isChatOpen ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Chat content */}
      <div
        className={`overflow-hidden border border-gray-300 bg-white shadow-lg transition-all duration-300 ease-in-out ${
          isChatOpen ? "max-h-[calc(100vh-100px)]" : "max-h-0"
        }`}
      >
        <div className="flex h-[calc(100vh-100px)] flex-col">
          {/* Chat messages container */}
          <div ref={chatContainerRef} className="flex-1 space-y-2 overflow-y-auto p-6" style={{ scrollBehavior: "smooth" }}>
            {!ready && (
              <div className="flex h-full flex-col items-center justify-center text-gray-500">
                <div className="mb-2 animate-pulse">Loading...</div>
                <div className="text-sm">{loading}</div>
              </div>
            )}
            {ready && messages.length === 0 && !isRunning && (
              <div className="flex h-full flex-col items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="mb-2 text-lg">Chat is ready</div>
                  <div className="text-sm">Click the "Run" button to start the conversation</div>
                </div>
              </div>
            )}
            {renderChatMessages()}
          </div>

          {/* Chat input */}
          <div className="border-t border-gray-300 bg-gray-50 p-3">
            <div className="flex items-center">
              <input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={events.length > 0 ? "Enter your message..." : "Chat is ready"}
                className="flex-1 rounded-l-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={events.length === 0}
              />
              <button
                className={`rounded-r-lg px-4 py-3 font-medium text-white ${
                  events.length === 0 ? "cursor-not-allowed bg-gray-300" : "bg-blue-500 hover:bg-blue-600"
                }`}
                onClick={() => {
                  if (events.length > 0) {
                    submitText(events[0]);
                  }
                }}
                disabled={events.length === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphRunner;
