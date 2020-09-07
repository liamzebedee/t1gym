import Dexie from "dexie"

let db

class DatabaseService {
  async connect() {
    db = new Dexie("diabetes")
    db.version(2).stores({
      annotations: "id++,startTime,endTime,*tags,notes",
    })
    await db.open()
  }

  async get() {
    if (!db) await this.connect()
    return db
  }
}

const databaseService = new DatabaseService()
export default databaseService
