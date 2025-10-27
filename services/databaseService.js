const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

class DatabaseService {
  constructor() {
    this.connections = {
      mongodb: null,
      postgres: null,
      mysql: null,
      sqlite: null
    };
    this.initializeConnections();
  }

  async initializeConnections() {
    try {
      // MongoDB connection
      if (process.env.MONGODB_URI) {
        this.connections.mongodb = new MongoClient(process.env.MONGODB_URI);
        await this.connections.mongodb.connect();
        console.log('✅ MongoDB connected');
      }

      // PostgreSQL connection
      if (process.env.POSTGRES_URL) {
        this.connections.postgres = new Pool({
          connectionString: process.env.POSTGRES_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        console.log('✅ PostgreSQL connected');
      }

      // MySQL connection
      if (process.env.MYSQL_URL) {
        this.connections.mysql = await mysql.createConnection(process.env.MYSQL_URL);
        console.log('✅ MySQL connected');
      }

      // SQLite connection
      if (process.env.SQLITE_PATH) {
        this.connections.sqlite = new sqlite3.Database(process.env.SQLITE_PATH);
        console.log('✅ SQLite connected');
      }
    } catch (error) {
      console.error('❌ Database connection error:', error);
    }
  }

  async query(database, query, parameters = []) {
    const dbType = this.getDatabaseType(database);
    
    switch (dbType) {
      case 'mongodb':
        return await this.mongoQuery(database, query, parameters);
      case 'postgres':
        return await this.postgresQuery(database, query, parameters);
      case 'mysql':
        return await this.mysqlQuery(database, query, parameters);
      case 'sqlite':
        return await this.sqliteQuery(database, query, parameters);
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  async insert(database, table, data) {
    const dbType = this.getDatabaseType(database);
    
    switch (dbType) {
      case 'mongodb':
        return await this.mongoInsert(database, table, data);
      case 'postgres':
        return await this.postgresInsert(database, table, data);
      case 'mysql':
        return await this.mysqlInsert(database, table, data);
      case 'sqlite':
        return await this.sqliteInsert(database, table, data);
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  async update(database, table, data, where) {
    const dbType = this.getDatabaseType(database);
    
    switch (dbType) {
      case 'mongodb':
        return await this.mongoUpdate(database, table, data, where);
      case 'postgres':
        return await this.postgresUpdate(database, table, data, where);
      case 'mysql':
        return await this.mysqlUpdate(database, table, data, where);
      case 'sqlite':
        return await this.sqliteUpdate(database, table, data, where);
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  async delete(database, table, where) {
    const dbType = this.getDatabaseType(database);
    
    switch (dbType) {
      case 'mongodb':
        return await this.mongoDelete(database, table, where);
      case 'postgres':
        return await this.postgresDelete(database, table, where);
      case 'mysql':
        return await this.mysqlDelete(database, table, where);
      case 'sqlite':
        return await this.sqliteDelete(database, table, where);
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  async createTable(database, table, schema) {
    const dbType = this.getDatabaseType(database);
    
    switch (dbType) {
      case 'mongodb':
        return await this.mongoCreateCollection(database, table, schema);
      case 'postgres':
        return await this.postgresCreateTable(database, table, schema);
      case 'mysql':
        return await this.mysqlCreateTable(database, table, schema);
      case 'sqlite':
        return await this.sqliteCreateTable(database, table, schema);
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  // MongoDB operations
  async mongoQuery(database, collection, query = {}) {
    try {
      const db = this.connections.mongodb.db(database);
      const coll = db.collection(collection);
      const results = await coll.find(query).toArray();
      
      return {
        success: true,
        database,
        collection,
        results,
        count: results.length
      };
    } catch (error) {
      return {
        success: false,
        database,
        collection,
        error: error.message
      };
    }
  }

  async mongoInsert(database, collection, data) {
    try {
      const db = this.connections.mongodb.db(database);
      const coll = db.collection(collection);
      
      if (Array.isArray(data)) {
        const result = await coll.insertMany(data);
        return {
          success: true,
          database,
          collection,
          insertedCount: result.insertedCount,
          insertedIds: result.insertedIds
        };
      } else {
        const result = await coll.insertOne(data);
        return {
          success: true,
          database,
          collection,
          insertedId: result.insertedId
        };
      }
    } catch (error) {
      return {
        success: false,
        database,
        collection,
        error: error.message
      };
    }
  }

  async mongoUpdate(database, collection, data, where) {
    try {
      const db = this.connections.mongodb.db(database);
      const coll = db.collection(collection);
      
      const result = await coll.updateMany(where, { $set: data });
      
      return {
        success: true,
        database,
        collection,
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      };
    } catch (error) {
      return {
        success: false,
        database,
        collection,
        error: error.message
      };
    }
  }

  async mongoDelete(database, collection, where) {
    try {
      const db = this.connections.mongodb.db(database);
      const coll = db.collection(collection);
      
      const result = await coll.deleteMany(where);
      
      return {
        success: true,
        database,
        collection,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      return {
        success: false,
        database,
        collection,
        error: error.message
      };
    }
  }

  async mongoCreateCollection(database, collection, schema) {
    try {
      const db = this.connections.mongodb.db(database);
      await db.createCollection(collection);
      
      // Create indexes if schema provided
      if (schema && schema.indexes) {
        for (const index of schema.indexes) {
          await db.collection(collection).createIndex(index.fields, index.options || {});
        }
      }
      
      return {
        success: true,
        database,
        collection,
        created: true
      };
    } catch (error) {
      return {
        success: false,
        database,
        collection,
        error: error.message
      };
    }
  }

  // PostgreSQL operations
  async postgresQuery(database, query, parameters = []) {
    try {
      const client = await this.connections.postgres.connect();
      const result = await client.query(query, parameters);
      client.release();
      
      return {
        success: true,
        database,
        results: result.rows,
        count: result.rowCount,
        fields: result.fields
      };
    } catch (error) {
      return {
        success: false,
        database,
        error: error.message
      };
    }
  }

  async postgresInsert(database, table, data) {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      
      const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      
      const result = await this.postgresQuery(database, query, values);
      
      return {
        success: true,
        database,
        table,
        inserted: result.results[0],
        count: 1
      };
    } catch (error) {
      return {
        success: false,
        database,
        table,
        error: error.message
      };
    }
  }

  async postgresUpdate(database, table, data, where) {
    try {
      const setClause = Object.keys(data).map((key, index) => `${key} = $${index + 1}`).join(', ');
      const whereClause = Object.keys(where).map((key, index) => `${key} = $${Object.keys(data).length + index + 1}`).join(' AND ');
      
      const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`;
      const parameters = [...Object.values(data), ...Object.values(where)];
      
      const result = await this.postgresQuery(database, query, parameters);
      
      return {
        success: true,
        database,
        table,
        updated: result.results,
        count: result.count
      };
    } catch (error) {
      return {
        success: false,
        database,
        table,
        error: error.message
      };
    }
  }

  async postgresDelete(database, table, where) {
    try {
      const whereClause = Object.keys(where).map((key, index) => `${key} = $${index + 1}`).join(' AND ');
      const query = `DELETE FROM ${table} WHERE ${whereClause} RETURNING *`;
      const parameters = Object.values(where);
      
      const result = await this.postgresQuery(database, query, parameters);
      
      return {
        success: true,
        database,
        table,
        deleted: result.results,
        count: result.count
      };
    } catch (error) {
      return {
        success: false,
        database,
        table,
        error: error.message
      };
    }
  }

  async postgresCreateTable(database, table, schema) {
    try {
      const columns = schema.columns.map(col => {
        let definition = `${col.name} ${col.type}`;
        if (col.primaryKey) definition += ' PRIMARY KEY';
        if (col.notNull) definition += ' NOT NULL';
        if (col.unique) definition += ' UNIQUE';
        if (col.default !== undefined) definition += ` DEFAULT ${col.default}`;
        return definition;
      }).join(', ');
      
      const query = `CREATE TABLE IF NOT EXISTS ${table} (${columns})`;
      
      await this.postgresQuery(database, query);
      
      return {
        success: true,
        database,
        table,
        created: true
      };
    } catch (error) {
      return {
        success: false,
        database,
        table,
        error: error.message
      };
    }
  }

  // MySQL operations
  async mysqlQuery(database, query, parameters = []) {
    try {
      const [rows] = await this.connections.mysql.execute(query, parameters);
      
      return {
        success: true,
        database,
        results: rows,
        count: Array.isArray(rows) ? rows.length : 0
      };
    } catch (error) {
      return {
        success: false,
        database,
        error: error.message
      };
    }
  }

  async mysqlInsert(database, table, data) {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map(() => '?').join(', ');
      
      const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      
      const result = await this.mysqlQuery(database, query, values);
      
      return {
        success: true,
        database,
        table,
        insertId: result.results.insertId,
        affectedRows: result.results.affectedRows
      };
    } catch (error) {
      return {
        success: false,
        database,
        table,
        error: error.message
      };
    }
  }

  async mysqlUpdate(database, table, data, where) {
    try {
      const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      
      const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
      const parameters = [...Object.values(data), ...Object.values(where)];
      
      const result = await this.mysqlQuery(database, query, parameters);
      
      return {
        success: true,
        database,
        table,
        affectedRows: result.results.affectedRows
      };
    } catch (error) {
      return {
        success: false,
        database,
        table,
        error: error.message
      };
    }
  }

  async mysqlDelete(database, table, where) {
    try {
      const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      const query = `DELETE FROM ${table} WHERE ${whereClause}`;
      const parameters = Object.values(where);
      
      const result = await this.mysqlQuery(database, query, parameters);
      
      return {
        success: true,
        database,
        table,
        affectedRows: result.results.affectedRows
      };
    } catch (error) {
      return {
        success: false,
        database,
        table,
        error: error.message
      };
    }
  }

  async mysqlCreateTable(database, table, schema) {
    try {
      const columns = schema.columns.map(col => {
        let definition = `${col.name} ${col.type}`;
        if (col.primaryKey) definition += ' PRIMARY KEY';
        if (col.notNull) definition += ' NOT NULL';
        if (col.unique) definition += ' UNIQUE';
        if (col.default !== undefined) definition += ` DEFAULT ${col.default}`;
        return definition;
      }).join(', ');
      
      const query = `CREATE TABLE IF NOT EXISTS ${table} (${columns})`;
      
      await this.mysqlQuery(database, query);
      
      return {
        success: true,
        database,
        table,
        created: true
      };
    } catch (error) {
      return {
        success: false,
        database,
        table,
        error: error.message
      };
    }
  }

  // SQLite operations
  async sqliteQuery(database, query, parameters = []) {
    return new Promise((resolve, reject) => {
      this.connections.sqlite.all(query, parameters, (err, rows) => {
        if (err) {
          resolve({
            success: false,
            database,
            error: err.message
          });
        } else {
          resolve({
            success: true,
            database,
            results: rows,
            count: rows.length
          });
        }
      });
    });
  }

  async sqliteInsert(database, table, data) {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map(() => '?').join(', ');
      
      const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      
      const result = await this.sqliteQuery(database, query, values);
      
      return {
        success: true,
        database,
        table,
        lastID: result.results?.lastID,
        changes: result.results?.changes
      };
    } catch (error) {
      return {
        success: false,
        database,
        table,
        error: error.message
      };
    }
  }

  async sqliteUpdate(database, table, data, where) {
    try {
      const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      
      const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
      const parameters = [...Object.values(data), ...Object.values(where)];
      
      const result = await this.sqliteQuery(database, query, parameters);
      
      return {
        success: true,
        database,
        table,
        changes: result.results?.changes
      };
    } catch (error) {
      return {
        success: false,
        database,
        table,
        error: error.message
      };
    }
  }

  async sqliteDelete(database, table, where) {
    try {
      const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      const query = `DELETE FROM ${table} WHERE ${whereClause}`;
      const parameters = Object.values(where);
      
      const result = await this.sqliteQuery(database, query, parameters);
      
      return {
        success: true,
        database,
        table,
        changes: result.results?.changes
      };
    } catch (error) {
      return {
        success: false,
        database,
        table,
        error: error.message
      };
    }
  }

  async sqliteCreateTable(database, table, schema) {
    try {
      const columns = schema.columns.map(col => {
        let definition = `${col.name} ${col.type}`;
        if (col.primaryKey) definition += ' PRIMARY KEY';
        if (col.notNull) definition += ' NOT NULL';
        if (col.unique) definition += ' UNIQUE';
        if (col.default !== undefined) definition += ` DEFAULT ${col.default}`;
        return definition;
      }).join(', ');
      
      const query = `CREATE TABLE IF NOT EXISTS ${table} (${columns})`;
      
      await this.sqliteQuery(database, query);
      
      return {
        success: true,
        database,
        table,
        created: true
      };
    } catch (error) {
      return {
        success: false,
        database,
        table,
        error: error.message
      };
    }
  }

  // Helper methods
  getDatabaseType(database) {
    if (database.includes('mongodb') || database.includes('mongo')) return 'mongodb';
    if (database.includes('postgres') || database.includes('postgresql')) return 'postgres';
    if (database.includes('mysql')) return 'mysql';
    if (database.includes('sqlite')) return 'sqlite';
    return 'mongodb'; // default
  }

  async getConnectionStatus() {
    const status = {};
    
    for (const [name, connection] of Object.entries(this.connections)) {
      if (connection) {
        try {
          // Test connection based on type
          switch (name) {
            case 'mongodb':
              await connection.db().admin().ping();
              status[name] = 'connected';
              break;
            case 'postgres':
              await connection.query('SELECT 1');
              status[name] = 'connected';
              break;
            case 'mysql':
              await connection.ping();
              status[name] = 'connected';
              break;
            case 'sqlite':
              status[name] = 'connected';
              break;
          }
        } catch (error) {
          status[name] = 'disconnected';
        }
      } else {
        status[name] = 'not_configured';
      }
    }
    
    return status;
  }

  async closeConnections() {
    for (const [name, connection] of Object.entries(this.connections)) {
      if (connection) {
        try {
          switch (name) {
            case 'mongodb':
              await connection.close();
              break;
            case 'postgres':
              await connection.end();
              break;
            case 'mysql':
              await connection.end();
              break;
            case 'sqlite':
              connection.close();
              break;
          }
          console.log(`✅ ${name} connection closed`);
        } catch (error) {
          console.error(`❌ Error closing ${name} connection:`, error);
        }
      }
    }
  }
}

module.exports = new DatabaseService();