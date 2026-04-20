import {RowsetStatus} from './RowsetStatus'
import {Rowset} from './Rowset'
import {Rowsets} from './Rowsets'
import {equals, every, isEmpty, some} from 'lodash/fp'
import { Data } from '@hopara/encoding'
import {Logger} from '@hopara/internals'
import { Row } from '@hopara/dataset'
import { PositionNormalizer } from '@hopara/projector'
import { SimpleFetchState } from './fetch/SimpleFetchState'
import { isNil } from 'lodash'

type RowsetMap = {
  [rowsetId: string]: Rowset
}

type StatusMap = {
  [rowsetId: string]: RowsetStatus
}

const positionNormalizer = new PositionNormalizer()

export class RowsetStore {
  rowsets: RowsetMap = {}
  status: StatusMap = {}

  constructor(rowsets = {}, status = {}) {
    // We use assign to create a copy
    Object.assign(this.rowsets, rowsets)
    Object.assign(this.status, status)
  }

  add(rowset: Rowset) {
    if (!rowset) return

    this.rowsets[rowset.getId()] = rowset
    this.status[rowset.getId()] = RowsetStatus.NONE
  }

  immutableAdd(rowset: Rowset): RowsetStore {
    const clonedRowsetStore = this.clone()
    clonedRowsetStore.add(rowset)

    return clonedRowsetStore
  }

  addAll(rowsets: Rowset[]): RowsetStore {
    const clonedRowsetStore = this.clone()

    for (const rowset of rowsets) {
      clonedRowsetStore.add(rowset)
    }

    return clonedRowsetStore
  }

  invalidate(data: Data) {
    const cloned = this.clone()

    const rowsetsArray = new Rowsets(...Object.values(this.rowsets))
    for (const rowset of rowsetsArray.withData(data)) {
      cloned.rowsets[rowset.getId()].fetchState?.invalidate()
    }

    return cloned
  }

  invalidateById(rowsetId:string) {
    if (this.rowsets[rowsetId]) {
      const cloned = this.clone()
      cloned.rowsets[rowsetId].fetchState?.invalidate()
      return cloned
    } 

    return this
  }

  invalidateAll(): RowsetStore {
    const cloned = this.clone()
    for (const rowset of Object.values(cloned.rowsets)) {
      cloned.rowsets[rowset.getId()] = cloned.rowsets[rowset.getId()].clone()
      cloned.rowsets[rowset.getId()].fetchState?.invalidate()
    }
    return cloned
  }

  invalidateAllBut(exludeRowsetId:string): RowsetStore {
    const cloned = this.clone()
    for (const rowset of Object.values(cloned.rowsets)) {
      if (rowset.getId() === exludeRowsetId) {
        continue
      }

       
      cloned.rowsets[rowset.getId()] = cloned.rowsets[rowset.getId()].clone()
      cloned.rowsets[rowset.getId()].fetchState?.invalidate()
    }
    return cloned
  }

  getStatus(rowset?: Rowset): RowsetStatus {
    if (!rowset?.getId() || !this.status[rowset.getId()]) {
      return RowsetStatus.NONE
    } else {
      return this.status[rowset.getId()]
    }
  }

  clone(): RowsetStore {
    return new RowsetStore(this.rowsets, this.status)
  }

  getRowsets(): Rowsets {
    return new Rowsets(...Object.values(this.rowsets))
  }

  getRowset(rowsetId: string | undefined): Rowset | undefined {
    if ( !rowsetId ) return undefined
    return this.rowsets[rowsetId]
  }

  getByTargetRowset(rowset?: Rowset): Rowset | undefined {
    if (!rowset) return
    return this.rowsets[rowset.getId()]
  }

  getRow(rowsetId: string | undefined, rowId: string | undefined): Row | undefined {
    if (isNil(rowsetId) || isNil(rowId)) return undefined

    const rowset = this.rowsets[rowsetId]    
    return rowset?.getRow(rowId)
  }

  updateRow(rowsetId: string | undefined, row: Row): RowsetStore {
    if (!rowsetId) return this

    const clonedRowsetStore = this.clone()

    if (clonedRowsetStore.rowsets[rowsetId]) {
      const rowset = clonedRowsetStore.rowsets[rowsetId].updateRow(positionNormalizer.normalize(row, clonedRowsetStore.rowsets[rowsetId].positionEncoding))
      clonedRowsetStore.rowsets = {
        ...clonedRowsetStore.rowsets,
        [rowsetId]: rowset,
      }
    } else {
      Logger.info(`rowset ${rowsetId} doesn't exists`)
    }

    return clonedRowsetStore
  }

  partialUpdateRow(rowsetId: string, rowId: string, updatedFields: any, normalizePosition:boolean = false): RowsetStore {
    if (!rowsetId) return this

    const clonedRowsetStore = this.clone()
    const rowset = clonedRowsetStore.rowsets[rowsetId]  
    const stateRow = rowset?.getRow(rowId)
    if (!stateRow?._id) return this

    let updatedRow = stateRow.partialUpdate(updatedFields)
    if ( normalizePosition ) {
      updatedRow = positionNormalizer.normalize(updatedRow, rowset.positionEncoding, true)
    }

    clonedRowsetStore.rowsets = {
      ...clonedRowsetStore.rowsets,
      [rowsetId]: rowset.updateRow(updatedRow),
    }

    return clonedRowsetStore
  }

  setStatus(rowset: Rowset, rowsetStatus:RowsetStatus): RowsetStore {
    const cloned = this.clone()
    cloned.status = {
      ...cloned.status,
      [rowset.getId()]: rowsetStatus,
    }
    return cloned
  }

  hasRowsets(): boolean {
    return !isEmpty(this.rowsets)
  }

  someLoading(): boolean {
    return !isEmpty(this.status) && some(equals(RowsetStatus.LOADING), this.status)
  }

  allLoaded() : boolean {
    return every(equals(RowsetStatus.LOADED), this.status)
  }

  noneFilled(): boolean {
    return isEmpty(this.status)
  }

  everyWithError(): boolean {
    return !isEmpty(this.status) && every(
      equals(RowsetStatus.ERROR),
      this.status)
  }

  deleteRow(rowsetId: string, row: Row) {
    const cloned = this.clone()
    cloned.rowsets[rowsetId] = cloned.rowsets[rowsetId]?.deleteRow(row)
    return cloned
  }

  createRowsetIfNotExists(rowset: Rowset): RowsetStore {
    const cloned = this.clone()
    if (!cloned.rowsets[rowset.getId()]) {
      // To force reload on next refresh
      rowset.fetchState = new SimpleFetchState({invalidated: true})
      cloned.add(rowset)
    }
    return cloned
  }

  updateAllEtagModifier(key: string, value: any) {
    const cloned = this.clone()
    const rowsets = Object.values(cloned.rowsets)
    cloned.rowsets = rowsets.reduce((acc, r) => {
      const rowset = r.clone()
      const newRows = rowset.rows.clone()
      newRows.updateEtagModifier(key, value)
      rowset.rows = newRows
      acc[rowset.getId()] = rowset
      return acc
    }, {})
    return cloned
  }
}
