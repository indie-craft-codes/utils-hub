/**
 * 파싱된 테이블 스키마를 Vue Flow 노드/엣지로 변환
 */

import { getSmoothStepPath } from '@vue-flow/core'

/**
 * 테이블 배열을 Vue Flow 노드와 엣지로 변환
 * @param {Array} tables - 파싱된 테이블 정보 배열
 * @param {boolean} useLogicalNames - 논리명 사용 여부
 * @returns {Object} { nodes, edges }
 */
export function convertToFlowElements(tables, useLogicalNames = false) {
  const nodes = []
  const edges = []

  // FK 관계 기반 계층 구조 분석
  const hierarchy = buildHierarchy(tables)

  // 각 레벨의 최대 높이 계산 (중앙 정렬용)
  const levelMaxHeights = hierarchy.map(level => {
    return Math.max(...level.map(table => estimateNodeHeight(table)))
  })

  // 계층별로 노드 생성
  hierarchy.forEach((level, depth) => {
    const maxHeight = levelMaxHeights[depth]
    level.forEach((table, indexInLevel) => {
      const node = createTableNode(table, depth, indexInLevel, level.length, maxHeight, useLogicalNames)
      nodes.push(node)
    })
  })

  // FK 관계를 엣지로 변환
  tables.forEach((table) => {
    if (table.foreignKeys && table.foreignKeys.length > 0) {
      table.foreignKeys.forEach((fk, fkIndex) => {
        const sourceNode = nodes.find(n => n.id === table.name)
        const targetNode = nodes.find(n => n.id === fk.references.table)

        if (sourceNode && targetNode) {
          const edge = createForeignKeyEdge(table, fk, fkIndex, sourceNode, targetNode)
          if (edge) {
            edges.push(edge)
          }
        }
      })
    }
  })

  return { nodes, edges }
}

/**
 * 테이블의 예상 높이 계산 (컬럼 수 기반)
 */
function estimateNodeHeight(table) {
  const headerHeight = 40
  const rowHeight = 30
  const columnCount = table.columns.length
  return headerHeight + columnCount * rowHeight
}

/**
 * FK 관계 기반으로 테이블 계층 구조 생성
 */
function buildHierarchy(tables) {
  // 각 테이블의 참조 관계 맵 구성
  const tableMap = new Map(tables.map(t => [t.name, t]))
  const referencedBy = new Map() // 누가 나를 참조하는지
  const references = new Map()   // 내가 누구를 참조하는지

  tables.forEach(table => {
    references.set(table.name, new Set())
    if (!referencedBy.has(table.name)) {
      referencedBy.set(table.name, new Set())
    }
  })

  // FK 관계 분석
  tables.forEach(table => {
    if (table.foreignKeys && table.foreignKeys.length > 0) {
      table.foreignKeys.forEach(fk => {
        const targetTable = fk.references.table
        if (tableMap.has(targetTable)) {
          references.get(table.name).add(targetTable)
          if (!referencedBy.has(targetTable)) {
            referencedBy.set(targetTable, new Set())
          }
          referencedBy.get(targetTable).add(table.name)
        }
      })
    }
  })

  // 위상 정렬로 계층 레벨 결정
  const depths = new Map()
  const visited = new Set()

  function calculateDepth(tableName) {
    if (depths.has(tableName)) return depths.get(tableName)
    if (visited.has(tableName)) return 0 // 순환 참조 방지

    visited.add(tableName)

    const refs = references.get(tableName)
    if (!refs || refs.size === 0) {
      depths.set(tableName, 0)
      return 0
    }

    let maxDepth = 0
    refs.forEach(refTable => {
      const refDepth = calculateDepth(refTable)
      maxDepth = Math.max(maxDepth, refDepth + 1)
    })

    depths.set(tableName, maxDepth)
    return maxDepth
  }

  tables.forEach(table => calculateDepth(table.name))

  // 깊이별로 그룹화
  const hierarchy = []
  tables.forEach(table => {
    const depth = depths.get(table.name) || 0
    if (!hierarchy[depth]) {
      hierarchy[depth] = []
    }
    hierarchy[depth].push(table)
  })

  return hierarchy.filter(level => level && level.length > 0)
}

/**
 * 테이블을 Vue Flow 노드로 변환 (계층형 레이아웃)
 * @param {Object} table - 테이블 정보
 * @param {number} depth - 계층 깊이 (0부터 시작)
 * @param {number} indexInLevel - 같은 레벨 내 인덱스
 * @param {number} levelSize - 같은 레벨의 총 테이블 수
 * @param {number} levelMaxHeight - 같은 레벨의 최대 노드 높이 (중앙 정렬용)
 * @param {boolean} useLogicalNames - 논리명 사용 여부
 */
function createTableNode(table, depth, indexInLevel, levelSize, levelMaxHeight, useLogicalNames) {
  const displayName = useLogicalNames && table.logicalName
    ? table.logicalName
    : table.name

  // 컬럼 정보를 HTML로 포맷
  const columnsHtml = table.columns.map(col => {
    const displayColName = useLogicalNames && col.logicalName
      ? col.logicalName
      : col.name

    const icons = []
    if (col.isPrimaryKey) icons.push('PK')
    if (col.isUnique && !col.isPrimaryKey) icons.push('U')
    if (!col.isNullable && !col.isPrimaryKey) icons.push('NN')

    return {
      name: displayColName,
      type: col.type,
      icons: icons.join(' '),
      isPrimaryKey: col.isPrimaryKey,
      comment: col.comment
    }
  })

  // 계층형 레이아웃 위치 계산 (중앙 정렬)
  const spacing = { x: 400, y: 400 }

  // 수평 중앙 정렬: 레벨 전체 너비 계산
  const totalWidth = levelSize * spacing.x
  const startX = -totalWidth / 2 + spacing.x / 2

  // 수직 중앙 정렬: 이 테이블의 높이를 계산하고 레벨 최대 높이 기준으로 중앙 정렬
  const nodeHeight = estimateNodeHeight(table)
  const heightDiff = levelMaxHeight - nodeHeight
  const verticalOffset = heightDiff / 2 // 위아래 여백을 동일하게

  // 각 노드의 위치
  const x = startX + indexInLevel * spacing.x
  const y = depth * spacing.y + 50 + verticalOffset

  return {
    id: table.name,
    type: 'custom',
    draggable: true,
    position: {
      x,
      y
    },
    data: {
      label: displayName,
      physicalName: table.name,
      logicalName: table.logicalName,
      columns: columnsHtml,
      primaryKey: table.primaryKey
    }
  }
}

/**
 * FK를 Vue Flow 엣지로 변환
 */
function createForeignKeyEdge(table, fk, index, sourceNode, targetNode) {
  const sourceTable = table.name
  const targetTable = fk.references.table

  const edgeId = `${sourceTable}-${targetTable}-${index}`

  // 노드 간 상대 위치 계산하여 최적의 연결점 결정
  const { sourcePosition, targetPosition } = calculateOptimalPositions(
    sourceNode,
    targetNode
  )

  return {
    id: edgeId,
    source: sourceTable,
    target: targetTable,
    sourceHandle: sourcePosition, // handle ID 명시
    targetHandle: `${targetPosition}-target`, // target handle ID
    sourcePosition,
    targetPosition,
    type: 'smoothstep',
    animated: false,
    style: {
      stroke: '#6b7280',
      strokeWidth: 1.5
    },
    markerEnd: {
      type: 'arrowclosed',
      color: '#6b7280',
      width: 18,
      height: 18
    },
    label: fk.columns.join(', '),
    labelStyle: {
      fill: '#374151',
      fontWeight: 500,
      fontSize: 11
    },
    labelBgStyle: {
      fill: '#ffffff',
      fillOpacity: 0.95,
      rx: 2,
      ry: 2
    },
    labelBgPadding: [6, 3],
    data: {
      sourceColumns: fk.columns,
      targetColumns: fk.references.columns,
      onDelete: fk.onDelete,
      onUpdate: fk.onUpdate
    }
  }
}

/**
 * Smooth Step 엣지의 실제 렌더링된 경로 길이 계산
 */
function calculateStepPathLength(sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition) {
  try {
    // getSmoothStepPath로 path 데이터 생성
    const pathData = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition
    })

    // 임시 SVG path 생성하여 실제 길이 측정
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', pathData[0]) // pathData는 [path, labelX, labelY, offsetX, offsetY] 배열
    svg.appendChild(path)

    const length = path.getTotalLength()

    // 메모리 정리
    svg.remove()

    return length
  } catch (error) {
    console.error('Path length calculation error:', error)
    // 에러 발생 시 맨해튼 거리로 fallback
    return Math.abs(targetX - sourceX) + Math.abs(targetY - sourceY)
  }
}

/**
 * 두 노드 간 최적의 연결 위치 계산 (실제 최단 거리 기준)
 */
function calculateOptimalPositions(sourceNode, targetNode) {
  // 노드의 크기 추정 (dimensions가 있으면 사용, 없으면 기본값)
  const sourceWidth = sourceNode.dimensions?.width || sourceNode.width || 250
  const sourceHeight = sourceNode.dimensions?.height || sourceNode.height || 200
  const targetWidth = targetNode.dimensions?.width || targetNode.width || 250
  const targetHeight = targetNode.dimensions?.height || targetNode.height || 200

  // 노드의 경계 계산
  const source = {
    left: sourceNode.position.x,
    right: sourceNode.position.x + sourceWidth,
    top: sourceNode.position.y,
    bottom: sourceNode.position.y + sourceHeight,
    centerX: sourceNode.position.x + sourceWidth / 2,
    centerY: sourceNode.position.y + sourceHeight / 2
  }

  const target = {
    left: targetNode.position.x,
    right: targetNode.position.x + targetWidth,
    top: targetNode.position.y,
    bottom: targetNode.position.y + targetHeight,
    centerX: targetNode.position.x + targetWidth / 2,
    centerY: targetNode.position.y + targetHeight / 2
  }

  // Smooth Step 엣지의 실제 경로 길이 계산 - 모든 합리적인 조합 검토
  // 각 handle의 실제 위치 계산
  const sourceHandles = {
    right: { x: source.right, y: source.centerY },
    left: { x: source.left, y: source.centerY },
    bottom: { x: source.centerX, y: source.bottom },
    top: { x: source.centerX, y: source.top }
  }

  const targetHandles = {
    left: { x: target.left, y: target.centerY },
    right: { x: target.right, y: target.centerY },
    top: { x: target.centerX, y: target.top },
    bottom: { x: target.centerX, y: target.bottom }
  }

  // 16가지 조합 중 같은 방향 제외 (12가지)
  const combinations = [
    // source.right
    { source: 'right', target: 'left', sourcePos: sourceHandles.right, targetPos: targetHandles.left },
    { source: 'right', target: 'top', sourcePos: sourceHandles.right, targetPos: targetHandles.top },
    { source: 'right', target: 'bottom', sourcePos: sourceHandles.right, targetPos: targetHandles.bottom },
    // source.left
    { source: 'left', target: 'right', sourcePos: sourceHandles.left, targetPos: targetHandles.right },
    { source: 'left', target: 'top', sourcePos: sourceHandles.left, targetPos: targetHandles.top },
    { source: 'left', target: 'bottom', sourcePos: sourceHandles.left, targetPos: targetHandles.bottom },
    // source.bottom
    { source: 'bottom', target: 'top', sourcePos: sourceHandles.bottom, targetPos: targetHandles.top },
    { source: 'bottom', target: 'left', sourcePos: sourceHandles.bottom, targetPos: targetHandles.left },
    { source: 'bottom', target: 'right', sourcePos: sourceHandles.bottom, targetPos: targetHandles.right },
    // source.top
    { source: 'top', target: 'bottom', sourcePos: sourceHandles.top, targetPos: targetHandles.bottom },
    { source: 'top', target: 'left', sourcePos: sourceHandles.top, targetPos: targetHandles.left },
    { source: 'top', target: 'right', sourcePos: sourceHandles.top, targetPos: targetHandles.right }
  ]

  const distances = combinations.map(combo => {
    // 실제 렌더링된 step 엣지의 경로 길이 계산
    const distance = calculateStepPathLength(
      combo.sourcePos.x,
      combo.sourcePos.y,
      combo.targetPos.x,
      combo.targetPos.y,
      combo.source,
      combo.target
    )

    return {
      sourcePosition: combo.source,
      targetPosition: combo.target,
      distance,
      name: `${combo.source}→${combo.target}`
    }
  })

  // 가장 짧은 거리를 가진 조합 선택
  let minDistance = Infinity
  let result = { sourcePosition: 'right', targetPosition: 'left' }
  let selectedName = ''

  distances.forEach(combo => {
    if (combo.distance < minDistance) {
      minDistance = combo.distance
      selectedName = combo.name
      result = {
        sourcePosition: combo.sourcePosition,
        targetPosition: combo.targetPosition
      }
    }
  })

  return result
}

/**
 * 논리명과 물리명 토글
 */
export function toggleLogicalPhysical(nodes, tables, useLogicalNames) {
  return nodes.map(node => {
    const table = tables.find(t => t.name === node.id)
    if (!table) return node

    const displayName = useLogicalNames && table.logicalName
      ? table.logicalName
      : table.name

    const columnsHtml = table.columns.map(col => {
      const displayColName = useLogicalNames && col.logicalName
        ? col.logicalName
        : col.name

      const icons = []
      if (col.isPrimaryKey) icons.push('PK')
      if (col.isUnique && !col.isPrimaryKey) icons.push('U')
      if (!col.isNullable && !col.isPrimaryKey) icons.push('NN')

      return {
        name: displayColName,
        type: col.type,
        icons: icons.join(' '),
        isPrimaryKey: col.isPrimaryKey,
        comment: col.comment
      }
    })

    return {
      ...node,
      data: {
        ...node.data,
        label: displayName,
        columns: columnsHtml
      }
    }
  })
}

/**
 * 엣지 위치를 동적으로 업데이트
 */
export function updateEdgePositions(nodes, edges) {
  return edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    const targetNode = nodes.find(n => n.id === edge.target)

    if (sourceNode && targetNode) {
      const { sourcePosition, targetPosition } = calculateOptimalPositions(
        sourceNode,
        targetNode
      )

      return {
        ...edge,
        sourceHandle: sourcePosition,
        targetHandle: `${targetPosition}-target`,
        sourcePosition,
        targetPosition
      }
    }

    return edge
  })
}

/**
 * 노드 위치를 localStorage에 저장
 */
export function saveNodePositions(nodes) {
  const positions = {}
  nodes.forEach(node => {
    positions[node.id] = node.position
  })
  localStorage.setItem('erd-node-positions', JSON.stringify(positions))
}

/**
 * 저장된 노드 위치 복원
 */
export function restoreNodePositions(nodes) {
  const savedPositions = localStorage.getItem('erd-node-positions')
  if (!savedPositions) return nodes

  try {
    const positions = JSON.parse(savedPositions)
    return nodes.map(node => {
      if (positions[node.id]) {
        return { ...node, position: positions[node.id] }
      }
      return node
    })
  } catch (error) {
    console.error('위치 복원 실패:', error)
    return nodes
  }
}
