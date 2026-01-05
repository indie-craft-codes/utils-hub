/**
 * 파싱된 테이블 스키마를 Vue Flow 노드/엣지로 변환
 */

/**
 * 테이블 배열을 Vue Flow 노드와 엣지로 변환
 * @param {Array} tables - 파싱된 테이블 정보 배열
 * @param {boolean} useLogicalNames - 논리명 사용 여부
 * @returns {Object} { nodes, edges }
 */
export function convertToFlowElements(tables, useLogicalNames = false) {
  const nodes = []
  const edges = []

  // 테이블당 노드 생성
  tables.forEach((table, index) => {
    const node = createTableNode(table, index, useLogicalNames)
    nodes.push(node)
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
 * 테이블을 Vue Flow 노드로 변환
 */
function createTableNode(table, index, useLogicalNames) {
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

  // 노드 위치 자동 계산 (그리드 레이아웃)
  const columns = 3
  const row = Math.floor(index / columns)
  const col = index % columns
  const spacing = { x: 350, y: 300 }

  return {
    id: table.name,
    type: 'custom',
    position: {
      x: col * spacing.x + 50,
      y: row * spacing.y + 50
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
    sourcePosition,
    targetPosition,
    type: 'step',
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

  // Step 엣지의 실제 경로 길이 계산 (handle offset 포함)
  const handleOffset = 20 // Vue Flow step 엣지의 기본 offset

  const distances = {
    // source 오른쪽 → target 왼쪽 (target이 source보다 오른쪽에 있을 때만 유효)
    rightToLeft: {
      distance: (() => {
        if (target.left < source.right) return Infinity // 역방향: 무효
        const horizontal = target.left - source.right
        const vertical = Math.abs(target.centerY - source.centerY)
        return handleOffset * 2 + horizontal + vertical
      })(),
      sourcePosition: 'right',
      targetPosition: 'left'
    },
    // source 왼쪽 → target 오른쪽 (target이 source보다 왼쪽에 있을 때만 유효)
    leftToRight: {
      distance: (() => {
        if (source.left < target.right) return Infinity // 역방향: 무효
        const horizontal = source.left - target.right
        const vertical = Math.abs(target.centerY - source.centerY)
        return handleOffset * 2 + horizontal + vertical
      })(),
      sourcePosition: 'left',
      targetPosition: 'right'
    },
    // source 아래 → target 위 (target이 source보다 아래에 있을 때만 유효)
    bottomToTop: {
      distance: (() => {
        if (target.top < source.bottom) return Infinity // 역방향: 무효
        const horizontal = Math.abs(target.centerX - source.centerX)
        const vertical = target.top - source.bottom
        return handleOffset * 2 + horizontal + vertical
      })(),
      sourcePosition: 'bottom',
      targetPosition: 'top'
    },
    // source 위 → target 아래 (target이 source보다 위에 있을 때만 유효)
    topToBottom: {
      distance: (() => {
        if (source.top < target.bottom) return Infinity // 역방향: 무효
        const horizontal = Math.abs(target.centerX - source.centerX)
        const vertical = source.top - target.bottom
        return handleOffset * 2 + horizontal + vertical
      })(),
      sourcePosition: 'top',
      targetPosition: 'bottom'
    }
  }

  // 가장 짧은 거리를 가진 방향 선택
  let minDistance = Infinity
  let result = { sourcePosition: 'right', targetPosition: 'left' }
  let selectedDirection = ''

  for (const [direction, info] of Object.entries(distances)) {
    if (info.distance < minDistance) {
      minDistance = info.distance
      selectedDirection = direction
      result = {
        sourcePosition: info.sourcePosition,
        targetPosition: info.targetPosition
      }
    }
  }

  console.log(`\n🔍 [${sourceNode.id} → ${targetNode.id}] 실제 Step 경로 길이 계산`)
  console.log(`  📐 Source: (${source.left}, ${source.top}) ~ (${source.right}, ${source.bottom})`)
  console.log(`  📐 Target: (${target.left}, ${target.top}) ~ (${target.right}, ${target.bottom})`)
  console.log(`  📏 4방향 실제 경로 길이 (offset: ${handleOffset}px):`)

  const formatDistance = (dist) => dist === Infinity ? '∞ (역방향)' : `${dist.toFixed(0)}px`

  console.log(`     ➡️  right → left:  ${formatDistance(distances.rightToLeft.distance)}`)
  console.log(`     ⬅️  left → right:  ${formatDistance(distances.leftToRight.distance)}`)
  console.log(`     ⬇️  bottom → top:  ${formatDistance(distances.bottomToTop.distance)}`)
  console.log(`     ⬆️  top → bottom:  ${formatDistance(distances.topToBottom.distance)}`)
  console.log(`  ✅ 선택: ${selectedDirection} (${minDistance.toFixed(0)}px)\n`)

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
