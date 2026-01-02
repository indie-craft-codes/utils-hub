import { Parser } from 'node-sql-parser'

const parser = new Parser()

/**
 * MySQL DDL을 파싱하여 테이블 스키마 정보 추출
 * @param {string} ddl - CREATE TABLE 문
 * @returns {Object|null} 파싱된 테이블 정보
 */
export function parseMySQLDDL(ddl) {
  try {
    const ast = parser.astify(ddl, { database: 'MySQL' })

    // CREATE TABLE 문이 아니면 null 반환
    if (!ast || ast.type !== 'create' || ast.keyword !== 'table') {
      return null
    }

    const tableName = ast.table[0].table
    const columns = []
    const foreignKeys = []
    const indexes = []
    let primaryKey = null

    // 컬럼 정보 추출
    if (ast.create_definitions) {
      for (const def of ast.create_definitions) {
        if (def.resource === 'column') {
          const column = {
            name: def.column.column,
            type: formatColumnType(def.definition),
            isNullable: !def.nullable || def.nullable.type !== 'not null',
            isPrimaryKey: false,
            isAutoIncrement: def.auto_increment === true,
            isUnique: false,
            comment: def.comment?.value?.value || '',
            defaultValue: def.default_val?.value?.value || null
          }
          columns.push(column)
        } else if (def.resource === 'constraint') {
          // PRIMARY KEY 제약조건
          if (def.constraint_type === 'primary key') {
            primaryKey = def.definition.map(d => d.column).join(',')
            def.definition.forEach(d => {
              const col = columns.find(c => c.name === d.column)
              if (col) col.isPrimaryKey = true
            })
          }
          // FOREIGN KEY 제약조건
          else if (def.constraint_type === 'foreign key') {
            const fk = {
              columns: def.definition.map(d => d.column),
              references: {
                table: def.reference_definition.table[0].table,
                columns: def.reference_definition.definition.map(d => d.column)
              },
              onDelete: def.reference_definition.on_action?.find(a => a.type === 'on delete')?.value || 'NO ACTION',
              onUpdate: def.reference_definition.on_action?.find(a => a.type === 'on update')?.value || 'NO ACTION'
            }
            foreignKeys.push(fk)
          }
          // UNIQUE 제약조건
          else if (def.constraint_type === 'unique key' || def.constraint_type === 'unique') {
            def.definition.forEach(d => {
              const col = columns.find(c => c.name === d.column)
              if (col) col.isUnique = true
            })
            indexes.push({
              name: def.constraint || 'unique_' + def.definition.map(d => d.column).join('_'),
              columns: def.definition.map(d => d.column),
              type: 'UNIQUE'
            })
          }
        }
      }
    }

    // 테이블 코멘트 추출 (논리명으로 사용)
    let logicalName = tableName
    if (ast.table_options) {
      const commentOption = ast.table_options.find(opt => opt.keyword === 'comment')
      if (commentOption) {
        logicalName = commentOption.symbol || tableName
      }
    }

    return {
      name: tableName,
      logicalName,
      columns,
      foreignKeys,
      indexes,
      primaryKey
    }
  } catch (error) {
    console.error('DDL 파싱 오류:', error)
    throw new Error(`DDL 파싱 실패: ${error.message}`)
  }
}

/**
 * 여러 개의 DDL 문을 파싱
 * @param {string} ddlText - 여러 CREATE TABLE 문 (세미콜론으로 구분)
 * @returns {Array} 파싱된 테이블 정보 배열
 */
export function parseMultipleDDL(ddlText) {
  const tables = []
  const errors = []

  // 세미콜론으로 구분된 DDL 문 분리
  const statements = ddlText
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  for (const statement of statements) {
    try {
      const table = parseMySQLDDL(statement)
      if (table) {
        tables.push(table)
      }
    } catch (error) {
      errors.push({
        statement: statement.substring(0, 50) + '...',
        error: error.message
      })
    }
  }

  return { tables, errors }
}

/**
 * 컬럼 타입 포맷팅
 */
function formatColumnType(definition) {
  if (!definition) return 'UNKNOWN'

  const dataType = definition.dataType?.toUpperCase() || 'UNKNOWN'

  // 길이가 있는 타입 (VARCHAR, CHAR 등)
  if (definition.length) {
    return `${dataType}(${definition.length})`
  }

  // 정밀도가 있는 타입 (DECIMAL 등)
  if (definition.scale !== undefined) {
    return `${dataType}(${definition.length || 10},${definition.scale})`
  }

  return dataType
}

/**
 * 논리명을 물리명으로 변환하는 샘플 함수
 * (실제로는 사용자가 수동으로 입력하거나 매핑 테이블 사용)
 */
export function extractLogicalName(comment) {
  if (!comment) return null

  // 코멘트에서 논리명 추출
  // 예: "사용자ID" 또는 "사용자 ID (PK)" 같은 형식
  const match = comment.match(/^([^\(\)]+)/)
  return match ? match[1].trim() : null
}
