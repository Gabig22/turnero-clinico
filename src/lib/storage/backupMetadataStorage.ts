export const BACKUP_METADATA_KEY = 'turnero_backup_metadata_v1'

export type BackupMetadata = {
  last_imported_at?: string
}

function isBrowser() {
  return typeof window !== 'undefined'
}

export function readBackupMetadata(): BackupMetadata {
  if (!isBrowser()) {
    return {}
  }

  const storedValue = window.localStorage.getItem(BACKUP_METADATA_KEY)

  if (!storedValue) {
    return {}
  }

  try {
    return JSON.parse(storedValue) as BackupMetadata
  } catch {
    return {}
  }
}

export function writeBackupMetadata(metadata: BackupMetadata) {
  if (!isBrowser()) {
    return metadata
  }

  window.localStorage.setItem(BACKUP_METADATA_KEY, JSON.stringify(metadata))
  return metadata
}
