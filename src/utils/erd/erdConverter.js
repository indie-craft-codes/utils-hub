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
      console.log(`🔗 ${table.name}의 FK 변환 중:`, table.foreignKeys)
      table.foreignKeys.forEach((fk, fkIndex) => {
        const sourceNode = nodes.find(n => n.id === table.name)
        const targetNode = nodes.find(n => n.id === fk.references.table)

        if (sourceNode && targetNode) {
          const edge = createForeignKeyEdge(table, fk, fkIndex, sourceNode, targetNode)
          if (edge) {
            edges.push(edge)
            console.log('✅ 엣지 생성:', edge.id, `${edge.source} → ${edge.target}`)
          }
        }
      })
    }
  })

  console.log(`📈 ERD 생성 완료: 노드 ${nodes.length}개, 엣지 ${edges.length}개`)

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
    if (col.isPrimaryKey) icons.push('🔑')
    if (col.isUnique && !col.isPrimaryKey) icons.push('⚷')
    if (!col.isNullable && !col.isPrimaryKey) icons.push('*')

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
    type: 'smoothstep',
    animated: false,
    style: {
      stroke: '#6366f1',
      strokeWidth: 2.5
    },
    markerEnd: {
      type: 'arrowclosed',
      color: '#6366f1',
      width: 20,
      height: 20
    },
    label: fk.columns.join(', '),
    labelStyle: {
      fill: '#374151',
      fontWeight: 600,
      fontSize: 12
    },
    labelBgStyle: {
      fill: '#ffffff',
      fillOpacity: 0.9,
      rx: 4,
      ry: 4
    },
    labelBgPadding: [8, 4],
    data: {
      sourceColumns: fk.columns,
      targetColumns: fk.references.columns,
      onDelete: fk.onDelete,
      onUpdate: fk.onUpdate
    }
  }
}

/**
 * 두 노드 간 최적의 연결 위치 계산
 */
function calculateOptimalPositions(sourceNode, targetNode) {
  // 노드의 크기 추정 (dimensions가 있으면 사용, 없으면 기본값)
  const sourceWidth = sourceNode.dimensions?.width || sourceNode.width || 250
  const sourceHeight = sourceNode.dimensions?.height || sourceNode.height || 200
  const targetWidth = targetNode.dimensions?.width || targetNode.width || 250
  const targetHeight = targetNode.dimensions?.height || targetNode.height || 200

  // 노드의 중심점 계산
  const sourceCenter = {
    x: sourceNode.position.x + sourceWidth / 2,
    y: sourceNode.position.y + sourceHeight / 2
  }
  const targetCenter = {
    x: targetNode.position.x + targetWidth / 2,
    y: targetNode.position.y + targetHeight / 2
  }

  const dx = targetCenter.x - sourceCenter.x
  const dy = targetCenter.y - sourceCenter.y

  console.log(`\n🔍 [${sourceNode.id} → ${targetNode.id}] 엣지 연결 위치 계산`)
  console.log(`  📍 Source Position: (${sourceNode.position.x}, ${sourceNode.position.y})`)
  console.log(`  📍 Target Position: (${targetNode.position.x}, ${targetNode.position.y})`)
  console.log(`  📐 Source Dimensions: ${sourceWidth} x ${sourceHeight}`)
  console.log(`  📐 Target Dimensions: ${targetWidth} x ${targetHeight}`)
  console.log(`  🎯 Source Center: (${sourceCenter.x}, ${sourceCenter.y})`)
  console.log(`  🎯 Target Center: (${targetCenter.x}, ${targetCenter.y})`)
  console.log(`  📏 Distance: dx=${dx}, dy=${dy}`)
  console.log(`  📊 Absolute: |dx|=${Math.abs(dx)}, |dy|=${Math.abs(dy)}`)
  console.log(`  🔄 Comparison: |dx| ${Math.abs(dx) > Math.abs(dy) ? '>' : '<='} |dy|`)

  // 가로 방향 거리가 세로 방향 거리보다 큰 경우
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      // target이 source의 오른쪽에 있음
      console.log(`  ➡️ 결정: right → left (가로 연결, target이 오른쪽)\n`)
      return { sourcePosition: 'right', targetPosition: 'left' }
    } else {
      // target이 source의 왼쪽에 있음
      console.log(`  ⬅️ 결정: left → right (가로 연결, target이 왼쪽)\n`)
      return { sourcePosition: 'left', targetPosition: 'right' }
    }
  } else {
    // 세로 방향 거리가 더 큰 경우
    if (dy > 0) {
      // target이 source의 아래쪽에 있음
      console.log(`  ⬇️ 결정: bottom → top (세로 연결, target이 아래)\n`)
      return { sourcePosition: 'bottom', targetPosition: 'top' }
    } else {
      // target이 source의 위쪽에 있음
      console.log(`  ⬆️ 결정: top → bottom (세로 연결, target이 위)\n`)
      return { sourcePosition: 'top', targetPosition: 'bottom' }
    }
  }
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
      if (col.isPrimaryKey) icons.push('🔑')
      if (col.isUnique && !col.isPrimaryKey) icons.push('⚷')
      if (!col.isNullable && !col.isPrimaryKey) icons.push('*')

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
