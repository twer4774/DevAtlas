import React from 'react';
import type { TreeNodeProps } from '../../types/treeView'

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  parentPosition,
  expandedNodes,
  selectedNodeId
}) => {
  const hasChildren = node.children && node.children.length > 0;

  // 노드 크기 계산 (레벨에 따라 다르게)
  const getNodeSize = () => {
    switch (node.type) {
      case 'group':
        return { width: 280, height: 100 };
      case 'project':
        return { width: 240, height: 80 };
      case 'category':
        return { width: 180, height: 60 };
      case 'issue':
        return { width: 260, height: 55 };
      default:
        return { width: 200, height: 70 };
    }
  };

  const nodeSize = getNodeSize();

  // 우선순위별 테두리 색상
  const getPriorityBorderColor = () => {
    if (node.type !== 'issue') return 'transparent';
    
    switch (node.metadata.priority) {
      case 'urgent':
        return '#DC2626';
      case 'high':
        return '#EA580C';
      case 'medium':
        return '#CA8A04';
      case 'low':
        return '#65A30D';
      default:
        return '#6B7280';
    }
  };

  // 상태별 배경 패턴
  const getStatusPattern = () => {
    if (node.type !== 'issue') return 'none';
    
    switch (node.metadata.status) {
      case 'in_progress':
        return 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(59, 130, 246, 0.1) 2px, rgba(59, 130, 246, 0.1) 4px)';
      case 'resolved':
      case 'closed':
        return 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(16, 185, 129, 0.1) 2px, rgba(16, 185, 129, 0.1) 4px)';
      default:
        return 'none';
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* 노드 카드 컨테이너 - 버튼을 위한 여백 추가 */}
      <div
        className="relative"
        style={{
          width: nodeSize.width + (hasChildren ? 32 : 0), // 버튼을 위한 추가 너비
          height: nodeSize.height + (hasChildren ? 16 : 0), // 버튼을 위한 추가 높이
          padding: hasChildren ? '0 16px 16px 0' : '0', // 버튼을 위한 패딩
        }}
      >
        {/* 실제 노드 카드 */}
        <div
          className={`
            relative cursor-pointer transition-all duration-300 transform hover:scale-105
            ${isSelected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
            ${node.type === 'group' ? 'shadow-xl' : 'shadow-lg'}
            hover:shadow-2xl z-10
          `}
          style={{
            width: nodeSize.width,
            height: nodeSize.height,
          }}
          onClick={() => onSelect(node)}
        >
        {/* 메인 카드 */}
        <div
          className={`
            w-full h-full rounded-xl border-2 flex flex-col justify-center items-center
            text-white font-medium relative
            ${node.type === 'group' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : ''}
            ${node.type === 'project' ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' : ''}
            ${node.type === 'category' ? 'bg-gradient-to-br from-purple-500 to-purple-700' : ''}
            ${node.type === 'issue' ? 'bg-white text-gray-800 border-gray-300' : ''}
          `}
          style={{
            backgroundColor: node.type === 'issue' ? '#ffffff' : node.color,
            borderColor: getPriorityBorderColor(),
            backgroundImage: getStatusPattern(),
            overflow: 'visible', // 버튼이 잘리지 않도록 변경
          }}
        >
          {/* 아이콘과 텍스트 */}
          <div className="flex items-center space-x-3 px-4 py-2 w-full">
            <span className="text-2xl flex-shrink-0">{node.icon}</span>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div 
                className={`
                  font-bold leading-tight
                  ${node.type === 'group' ? 'text-lg' : ''}
                  ${node.type === 'project' ? 'text-base' : ''}
                  ${node.type === 'category' ? 'text-sm' : ''}
                  ${node.type === 'issue' ? 'text-sm text-gray-800' : ''}
                `}
                title={node.name}
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  lineHeight: '1.2'
                }}
              >
                {node.name}
              </div>
              {node.issueCount > 0 && (
                <div 
                  className={`
                    text-xs opacity-90 font-medium mt-1
                    ${node.type === 'issue' ? 'text-gray-600' : 'text-white'}
                  `}
                >
                  {node.issueCount} issue{node.issueCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* 확장/축소 버튼 */}
          {hasChildren && (
            <button
              className={`
                absolute -bottom-3 -right-3 w-8 h-8 rounded-full
                bg-white border-3 border-gray-300 flex items-center justify-center
                text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-lg
                ${isExpanded ? 'bg-blue-50 border-blue-400 text-blue-700' : ''}
              `}
              onClick={(e) => {
                e.stopPropagation();
                onToggle(node.id);
              }}
            >
              <span className="text-sm font-bold">
                {isExpanded ? '−' : '+'}
              </span>
            </button>
          )}

          {/* 상태 표시 점 (이슈용) */}
          {node.type === 'issue' && node.metadata.status && (
            <div
              className={`
                absolute top-3 right-3 w-4 h-4 rounded-full border-2 border-white
                ${node.metadata.status === 'open' ? 'bg-red-500' : ''}
                ${node.metadata.status === 'in_progress' ? 'bg-yellow-500' : ''}
                ${node.metadata.status === 'resolved' || node.metadata.status === 'closed' ? 'bg-green-500' : ''}
              `}
              title={`Status: ${node.metadata.status}`}
            />
          )}

          {/* 담당자 아바타 (이슈용) */}
          {node.type === 'issue' && node.metadata.assignee && (
            <div
              className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-xs font-bold text-white border-2 border-white"
              title={`Assigned to: ${node.metadata.assignee.name}`}
            >
              {node.metadata.assignee.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* 자식 노드들 */}
      {hasChildren && isExpanded && (
        <div className="relative mt-12">
          {/* 부모에서 아래로 내려오는 수직선 */}
          <div 
            className="absolute bg-gray-400"
            style={{
              width: '3px',
              height: '30px',
              left: '50%',
              top: '-42px',
              transform: 'translateX(-50%)',
              borderRadius: '1.5px'
            }}
          />
          
          {/* 자식 노드들을 가로로 배치 */}
          <div 
            className="flex justify-center items-start"
            style={{ 
              gap: node.children.length > 4 ? '40px' : node.children.length > 2 ? '80px' : '120px'
            }}
          >
            {node.children.map((child, index) => (
              <div key={child.id} className="relative">
                {/* 각 자식으로 내려가는 수직선 */}
                <div 
                  className="absolute bg-gray-400"
                  style={{
                    width: '3px',
                    height: '12px',
                    left: '50%',
                    top: '-12px',
                    transform: 'translateX(-50%)',
                    borderRadius: '1.5px'
                  }}
                />
                
                <TreeNode
                  node={child}
                  level={level + 1}
                  isExpanded={expandedNodes?.has(child.id) || false}
                  isSelected={selectedNodeId === child.id}
                  onToggle={onToggle}
                  onSelect={onSelect}
                  expandedNodes={expandedNodes}
                  selectedNodeId={selectedNodeId}
                />
              </div>
            ))}
          </div>
          
          {/* 전체 자식들을 연결하는 수평선 (자식이 2개 이상인 경우) */}
          {node.children.length > 1 && (
            <div 
              className="absolute bg-gray-400"
              style={{
                height: '3px',
                top: '-12px',
                left: '50%',
                width: `${(node.children.length - 1) * (
                  node.children.length > 4 ? 40 : 
                  node.children.length > 2 ? 80 : 120
                )}px`,
                transform: 'translateX(-50%)',
                borderRadius: '1.5px'
              }}
            />
          )}
          
          {/* 연결점들 */}
          <div 
            className="absolute bg-blue-500 border-2 border-white shadow-sm"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              left: '50%',
              top: '-13.5px',
              transform: 'translateX(-50%)',
              zIndex: 5
            }}
          />
          
          {/* 각 자식 연결점 */}
          {node.children.map((child, index) => {
            const gap = node.children.length > 4 ? 40 : node.children.length > 2 ? 80 : 120;
            const offset = (index - (node.children.length - 1) / 2) * gap;
            return (
              <div 
                key={`connection-${child.id}`}
                className="absolute bg-blue-500 border-2 border-white shadow-sm"
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  left: `calc(50% + ${offset}px)`,
                  top: '-13px',
                  transform: 'translateX(-50%)',
                  zIndex: 5
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TreeNode;