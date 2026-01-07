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
          const edge = createForeignKeyEdge(table, fk, fkIndex, sourceNode, targetNode, useLogicalNames)
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

  function calculateDepth(tableName, visiting = new Set()) {
    // 이미 계산된 depth가 있으면 반환
    if (depths.has(tableName)) return depths.get(tableName)

    // 순환 참조 감지
    if (visiting.has(tableName)) return 0

    const refs = references.get(tableName)
    if (!refs || refs.size === 0) {
      depths.set(tableName, 0)
      return 0
    }

    // 현재 노드를 방문 중으로 표시
    visiting.add(tableName)

    let maxDepth = 0
    refs.forEach(refTable => {
      const refDepth = calculateDepth(refTable, visiting)
      maxDepth = Math.max(maxDepth, refDepth + 1)
    })

    // 방문 완료 후 제거
    visiting.delete(tableName)

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
  const displayName = useLogicalNames && table.comment
    ? table.comment
    : table.name

  // FK 컬럼 목록 추출
  const fkColumnNames = new Set()
  if (table.foreignKeys && table.foreignKeys.length > 0) {
    table.foreignKeys.forEach(fk => {
      fk.columns.forEach(colName => fkColumnNames.add(colName))
    })
  }

  // 컬럼 정보를 HTML로 포맷
  const columnsHtml = table.columns.map(col => {
    const displayColName = useLogicalNames && col.logicalName
      ? col.logicalName
      : col.name

    const icons = []
    const isForeignKey = fkColumnNames.has(col.name)

    if (col.isPrimaryKey) icons.push('PK')
    if (isForeignKey && !col.isPrimaryKey) icons.push('FK')
    if (col.isUnique && !col.isPrimaryKey) icons.push('U')
    if (!col.isNullable && !col.isPrimaryKey) icons.push('NN')

    return {
      name: displayColName,
      type: col.type,
      icons: icons.join(' '),
      isPrimaryKey: col.isPrimaryKey,
      isForeignKey,
      comment: col.comment
    }
  })

  // 컬럼 정렬: PK 먼저, FK 다음, 나머지
  columnsHtml.sort((a, b) => {
    if (a.isPrimaryKey && !b.isPrimaryKey) return -1
    if (!a.isPrimaryKey && b.isPrimaryKey) return 1
    if (a.isForeignKey && !b.isForeignKey) return -1
    if (!a.isForeignKey && b.isForeignKey) return 1
    return 0
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
function createForeignKeyEdge(table, fk, index, sourceNode, targetNode, useLogicalNames = false) {
  const sourceTable = table.name
  const targetTable = fk.references.table

  const edgeId = `${sourceTable}-${targetTable}-${index}`

  // 노드 간 상대 위치 계산하여 최적의 연결점 결정
  const { sourcePosition, targetPosition } = calculateOptimalPositions(
    sourceNode,
    targetNode
  )

  // FK 레이블: 논리명 또는 물리명
  let label = fk.columns.join(', ')
  if (useLogicalNames) {
    const logicalNames = fk.columns.map(colName => {
      const column = table.columns.find(c => c.name === colName)
      return column?.logicalName || colName
    })
    label = logicalNames.join(', ')
  }

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
    label,
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
 * @param {Array} nodes - 현재 노드 배열
 * @param {Array} tables - 테이블 정보
 * @param {boolean} useLogicalNames - 논리명 사용 여부
 * @param {Map} actualWidths - DOM에서 읽은 실제 노드 너비 (선택)
 * @param {Map} actualHeights - DOM에서 읽은 실제 노드 높이 (선택)
 */
export function toggleLogicalPhysical(nodes, tables, useLogicalNames, actualWidths = null, actualHeights = null) {
  return nodes.map(node => {
    const table = tables.find(t => t.name === node.id)
    if (!table) return node

    const displayName = useLogicalNames && table.comment
      ? table.comment
      : table.name

    // FK 컬럼 목록 추출
    const fkColumnNames = new Set()
    if (table.foreignKeys && table.foreignKeys.length > 0) {
      table.foreignKeys.forEach(fk => {
        fk.columns.forEach(colName => fkColumnNames.add(colName))
      })
    }

    const columnsHtml = table.columns.map(col => {
      const displayColName = useLogicalNames && col.logicalName
        ? col.logicalName
        : col.name

      const icons = []
      const isForeignKey = fkColumnNames.has(col.name)

      if (col.isPrimaryKey) icons.push('PK')
      if (isForeignKey && !col.isPrimaryKey) icons.push('FK')
      if (col.isUnique && !col.isPrimaryKey) icons.push('U')
      if (!col.isNullable && !col.isPrimaryKey) icons.push('NN')

      return {
        name: displayColName,
        type: col.type,
        icons: icons.join(' '),
        isPrimaryKey: col.isPrimaryKey,
        isForeignKey,
        comment: col.comment
      }
    })

    // 컬럼 정렬: PK 먼저, FK 다음, 나머지
    columnsHtml.sort((a, b) => {
      if (a.isPrimaryKey && !b.isPrimaryKey) return -1
      if (!a.isPrimaryKey && b.isPrimaryKey) return 1
      if (a.isForeignKey && !b.isForeignKey) return -1
      if (!a.isForeignKey && b.isForeignKey) return 1
      return 0
    })

    // 실제 렌더링된 노드 너비 사용 (우선순위: DOM > dimensions > 추정)
    let oldWidth = estimateNodeWidth(node.data.label, node.data.columns)
    let widthSource = 'estimated'

    if (actualWidths && actualWidths.has(node.id)) {
      oldWidth = actualWidths.get(node.id)
      widthSource = 'DOM'
    } else if (node.dimensions?.width) {
      oldWidth = node.dimensions.width
      widthSource = 'dimensions'
    }

    const newWidth = estimateNodeWidth(displayName, columnsHtml)

    // 실제 렌더링된 노드 높이 사용 (우선순위: DOM > dimensions > 추정)
    let oldHeight = estimateNodeHeight(table)
    let heightSource = 'estimated'

    if (actualHeights && actualHeights.has(node.id)) {
      oldHeight = actualHeights.get(node.id)
      heightSource = 'DOM'
    } else if (node.dimensions?.height) {
      oldHeight = node.dimensions.height
      heightSource = 'dimensions'
    }

    const newHeight = estimateNodeHeight(table)

    // X 좌표: 중앙점 기준으로 위치 조정
    const oldCenterX = node.position.x + oldWidth / 2
    const adjustedX = oldCenterX - newWidth / 2
    const newCenterX = adjustedX + newWidth / 2

    // Y 좌표: 중앙점 기준으로 위치 조정
    const oldCenterY = node.position.y + oldHeight / 2
    const adjustedY = oldCenterY - newHeight / 2
    const newCenterY = adjustedY + newHeight / 2

    // 디버깅 로그
    console.log(`\n🔄 [${node.id}] 토글 (${useLogicalNames ? '논리명' : '물리명'})`)
    console.log(`  테이블명: "${node.data.label}" → "${displayName}"`)
    console.log(`  이전 너비: ${oldWidth.toFixed(1)}px (출처: ${widthSource})`)
    console.log(`  새 너비: ${newWidth.toFixed(1)}px (추정)`)
    console.log(`  이전 높이: ${oldHeight.toFixed(1)}px (출처: ${heightSource})`)
    console.log(`  새 높이: ${newHeight.toFixed(1)}px (추정)`)
    console.log(`  이전 position: (${node.position.x.toFixed(1)}, ${node.position.y.toFixed(1)})`)
    console.log(`  이전 중앙점: (${oldCenterX.toFixed(1)}, ${oldCenterY.toFixed(1)})`)
    console.log(`  새 position: (${adjustedX.toFixed(1)}, ${adjustedY.toFixed(1)})`)
    console.log(`  새 중앙점: (${newCenterX.toFixed(1)}, ${newCenterY.toFixed(1)})`)
    console.log(`  중앙점 차이: (${Math.abs(newCenterX - oldCenterX).toFixed(2)}, ${Math.abs(newCenterY - oldCenterY).toFixed(2)})px`)

    return {
      ...node,
      position: {
        x: adjustedX,
        y: adjustedY
      },
      data: {
        ...node.data,
        label: displayName,
        columns: columnsHtml
      }
    }
  })
}

/**
 * 노드의 예상 너비 계산 (텍스트 길이 기반)
 */
function estimateNodeWidth(tableName, columns) {
  // 최소 너비
  const minWidth = 200

  // 테이블명 기준 너비 (폰트 크기와 패딩 고려)
  // 한글은 영문보다 넓음
  const tableNameWidth = calculateTextWidth(tableName, 14, true) + 40

  // 컬럼명 + 타입 중 가장 긴 것 찾기
  let maxColumnWidth = minWidth
  columns.forEach(col => {
    // 아이콘(20px) + 컬럼명 + 타입 + 여백
    const iconWidth = col.icons ? 30 : 0
    const nameWidth = calculateTextWidth(col.name, 12, false)
    const typeWidth = calculateTextWidth(col.type, 11, false)
    const colWidth = iconWidth + nameWidth + typeWidth + 80
    maxColumnWidth = Math.max(maxColumnWidth, colWidth)
  })

  return Math.max(minWidth, tableNameWidth, maxColumnWidth)
}

/**
 * 텍스트 너비 추정 (한글/영문 구분)
 */
function calculateTextWidth(text, fontSize, isBold = false) {
  if (!text) return 0

  // 한글, 한자, 일본어 등 넓은 문자 감지
  const wideCharPattern = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uac00-\ud7a3]/

  let width = 0
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (wideCharPattern.test(char)) {
      // 한글/한자 등: fontSize와 거의 같은 너비
      width += fontSize * (isBold ? 1.1 : 1.0)
    } else {
      // 영문/숫자: fontSize의 약 0.6배
      width += fontSize * (isBold ? 0.7 : 0.6)
    }
  }

  return width
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
 * 엣지 레이블을 논리명/물리명으로 업데이트
 */
export function updateEdgeLabels(edges, tables, useLogicalNames) {
  return edges.map(edge => {
    const sourceTable = tables.find(t => t.name === edge.source)
    if (!sourceTable || !edge.data?.sourceColumns) return edge

    // FK 레이블: 논리명 또는 물리명
    let label = edge.data.sourceColumns.join(', ')
    if (useLogicalNames) {
      const logicalNames = edge.data.sourceColumns.map(colName => {
        const column = sourceTable.columns.find(c => c.name === colName)
        return column?.logicalName || colName
      })
      label = logicalNames.join(', ')
    }

    return {
      ...edge,
      label
    }
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
