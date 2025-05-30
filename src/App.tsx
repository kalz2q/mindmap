//無料マインドマップ 簡易版放射思考Webアプリ 線なし 色なし 画像なし 生成AI作成
//ロードとセーブあり

import React, {
  useState,
  useRef,
  MouseEvent as ReactMouseEvent,
  KeyboardEvent,
  ChangeEvent,
  useEffect,
} from "react";

// ノードのデータ構造を定義
interface NodeData {
  id: string;
  text: string;
  x: number;
  y: number;
}

const NODE_WIDTH = 160; // ノードの幅
const NODE_MIN_HEIGHT = 70; // ノードの最小高さ

const App: React.FC = () => {
  // ノードの状態管理
  const [nodes, setNodes] = useState<NodeData[]>([
    {
      id: "root",
      text: "中心トピック",
      x: window.innerWidth / 2 - NODE_WIDTH / 2,
      y: 100,
    },
  ]);

  // テキスト編集中ノードIDの状態管理
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  // 編集中テキストの状態管理
  const [editingText, setEditingText] = useState<string>("");

  // 選択されているノードIDの状態管理
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // ドラッグ中ノードの情報 (IDとマウス位置からのオフセット)
  const [draggingNode, setDraggingNode] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // マインドマップ全体のdiv要素への参照
  const mindMapRef = useRef<HTMLDivElement>(null);

  // ユニークなIDを生成する関数
  const generateId = (): string =>
    `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // ノードデータをテキストファイルとして保存
  const handleSave = () => {
    if (nodes.length === 0) return;

    // 中心ノードを1行目、それ以外を2行目以降に配置
    const rootNode = nodes.find((node) => node.id === "root");
    const otherNodes = nodes.filter((node) => node.id !== "root");

    const content = [
      `${rootNode?.text}`,
      ...otherNodes.map((node) => node.text),
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mindmap.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // テキストファイルを読み込んでノードを再構築
  const handleLoad = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content.split("\n").filter((line) => line.trim() !== "");
      if (lines.length === 0) return;

      // 1行目は中心ノード
      const newNodes: NodeData[] = [
        {
          id: "root",
          text: lines[0],
          x: window.innerWidth / 2 - NODE_WIDTH / 2,
          y: 100,
        },
      ];

      // 2行目以降は新しいノードとしてランダムに配置
      for (let i = 1; i < lines.length; i++) {
        newNodes.push({
          id: generateId(),
          text: lines[i],
          x: Math.random() * (window.innerWidth - NODE_WIDTH - 200) + 100, // 100から画面幅-200の間でランダム
          y: Math.random() * (window.innerHeight - NODE_MIN_HEIGHT - 200) + 100, // 100から画面高さ-200の間でランダム
        });
      }

      setNodes(newNodes);
    };
    reader.readAsText(file);
    e.target.value = ""; // 同じファイルを再度選択できるようにリセット
  };

  // 新しいノードを追加する関数
  const handleAddNode = () => {
    const lastNode =
      nodes.length > 0 ? nodes[nodes.length - 1] : { x: 50, y: 50 };
    const newNode: NodeData = {
      id: generateId(),
      text: "新しいアイデア",
      x: lastNode.x + NODE_WIDTH / 2 + 20,
      y: lastNode.y + NODE_MIN_HEIGHT / 2 + 20,
    };
    setNodes([...nodes, newNode]);
    setSelectedNodeId(newNode.id); // 新しく追加したノードを選択状態にする
    setEditingNodeId(newNode.id); // 同時に編集モードにする
    setEditingText(newNode.text);
  };

  // ノードのテキスト編集を開始する関数
  const handleEditStart = (node: NodeData) => {
    if (draggingNode) return;
    setEditingNodeId(node.id);
    setEditingText(node.text);
    setSelectedNodeId(node.id); // 編集開始時にノードを選択状態にする
  };

  // 編集中テキストが変更されたときの処理
  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditingText(e.target.value);
  };

  // ノードのテキスト編集を終了する関数
  const handleEditEnd = () => {
    if (editingNodeId) {
      setNodes((prevNodes) =>
        prevNodes.map((n) =>
          n.id === editingNodeId
            ? { ...n, text: editingText.trim() || "未入力" }
            : n
        )
      );
      setEditingNodeId(null);
    }
  };

  // input要素でのキー操作 (Enterで編集完了, Escapeでキャンセル)
  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleEditEnd();
    } else if (e.key === "Escape") {
      setEditingNodeId(null);
      setEditingText(nodes.find((n) => n.id === editingNodeId)?.text || "");
    }
  };

  // 選択されたノードを削除する関数
  const handleDeleteSelectedNode = () => {
    if (!selectedNodeId) return;
    if (selectedNodeId === "root") {
      alert("中心トピックは削除できません。");
      return;
    }
    setNodes((prevNodes) => prevNodes.filter((n) => n.id !== selectedNodeId));
    if (editingNodeId === selectedNodeId) {
      setEditingNodeId(null);
      setEditingText("");
    }
    setSelectedNodeId(null);
  };

  // ノードのドラッグを開始する関数
  const handleDragStart = (
    e: ReactMouseEvent<HTMLDivElement>,
    nodeId: string
  ) => {
    if (e.button !== 0 || editingNodeId === nodeId) return;

    const node = nodes.find((n) => n.id === nodeId);
    if (node && mindMapRef.current) {
      const mindMapRect = mindMapRef.current.getBoundingClientRect();
      setDraggingNode({
        id: nodeId,
        offsetX: e.clientX - node.x - mindMapRect.left,
        offsetY: e.clientY - node.y - mindMapRect.top,
      });
      setSelectedNodeId(nodeId);
      e.stopPropagation();
    }
  };

  const handleNodeClick = (
    e: ReactMouseEvent<HTMLDivElement>,
    nodeId: string
  ) => {
    if (draggingNode) return;
    setSelectedNodeId(nodeId);
  };

  // ノードをドラッグ中の関数
  const handleDragging = (e: MouseEvent) => {
    if (draggingNode && mindMapRef.current) {
      const mindMapRect = mindMapRef.current.getBoundingClientRect();
      let newX = e.clientX - draggingNode.offsetX - mindMapRect.left;
      let newY = e.clientY - draggingNode.offsetY - mindMapRect.top;

      newX = Math.max(0, Math.min(newX, mindMapRect.width - NODE_WIDTH));
      newY = Math.max(0, Math.min(newY, mindMapRect.height - NODE_MIN_HEIGHT));

      setNodes((prevNodes) =>
        prevNodes.map((n) =>
          n.id === draggingNode.id ? { ...n, x: newX, y: newY } : n
        )
      );
    }
  };

  // ノードのドラッグを終了する関数
  const handleDragEnd = () => {
    setDraggingNode(null);
  };

  useEffect(() => {
    if (draggingNode) {
      window.addEventListener("mousemove", handleDragging);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("mouseleave", handleDragEnd);
    } else {
      window.removeEventListener("mousemove", handleDragging);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("mouseleave", handleDragEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleDragging);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("mouseleave", handleDragEnd);
    };
  }, [draggingNode]);

  // 背景クリックで選択解除
  const handleBackgroundClick = () => {
    setSelectedNodeId(null);
    setEditingNodeId(null);
  };

  return (
    <div
      ref={mindMapRef}
      className="relative w-screen h-screen bg-slate-100 overflow-hidden select-none touch-none"
      onClick={handleBackgroundClick}
    >
      {/* 右上に配置するセーブ/ロードボタン */}
      <div className="fixed top-6 right-6 flex space-x-3 z-10">
        {/* ロードボタン */}
        <label className="bg-green-500 hover:bg-green-600 text-white font-semibold p-2 rounded shadow-lg hover:shadow-xl transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer">
          <input
            type="file"
            accept=".txt"
            onChange={handleLoad}
            className="hidden"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </label>

        {/* セーブボタン */}
        <button
          onClick={handleSave}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold p-2 rounded shadow-lg hover:shadow-xl transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="マインドマップを保存"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625a1.125 1.125 0 00-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </button>
      </div>

      {/* 各ノードをレンダリング */}
      {nodes.map((node) => {
        const isEditing = editingNodeId === node.id;
        const isSelected = selectedNodeId === node.id;

        let ringClass = "";
        if (isEditing) {
          ringClass = "ring-2 ring-blue-500 shadow-xl";
        } else if (isSelected) {
          ringClass = "ring-2 ring-green-500 shadow-lg";
        } else {
          ringClass = "bg-white hover:shadow-md";
        }

        return (
          <div
            key={node.id}
            className={`absolute p-4 rounded-xl shadow-md cursor-grab transition-all duration-150 ease-in-out flex flex-col items-center justify-center text-center
              ${ringClass}
              ${
                draggingNode?.id === node.id
                  ? "cursor-grabbing shadow-2xl opacity-90"
                  : ""
              }
            `}
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
              width: `${NODE_WIDTH}px`,
              minHeight: `${NODE_MIN_HEIGHT}px`,
              touchAction: "none",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleDragStart(e, node.id);
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleNodeClick(e, node.id);
            }}
          >
            {isEditing ? (
              <input
                type="text"
                value={editingText}
                onChange={handleTextChange}
                onBlur={handleEditEnd}
                onKeyDown={handleInputKeyDown}
                className="w-full p-2 border border-blue-400 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-sm break-words p-1 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!draggingNode) {
                    setTimeout(() => handleEditStart(node), 0);
                  }
                }}
              >
                {node.text || "クリックして編集"}
              </div>
            )}
          </div>
        );
      })}

      {/* アクションボタンコンテナ */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-10">
        {/* 選択ノード削除ボタン */}
        {selectedNodeId &&
          nodes.find((n) => n.id === selectedNodeId && n.id !== "root") && (
            <button
              onClick={handleDeleteSelectedNode}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              title="選択したノードを削除"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c.34-.059.678-.112 1.017-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          )}
        {/* 新しいノードを追加するボタン */}
        <button
          onClick={handleAddNode}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold p-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          title="新しいノードを追加"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default App;
