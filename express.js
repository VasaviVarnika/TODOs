const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const dbpath = path.join(__dirname, 'todoApplication.db')
let db = null
const initialize = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => console.log('Success'))
  } catch (e) {
    console.log(`db error ${e.message}`)
    process.exit(1)
  }
}
initialize()
const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const haspriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasstatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

// api 1
app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ' '
  const {search_q = ' ', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = ` 
        SELECT *
        FROM todo
        WHERE 
        todo LIKE '%${search_q}%'
        AND status ='${status}'
        AND priority='${priority}';`
      break

    case haspriorityProperty(request.query):
      getTodosQuery = `
        SELECT * FROM todo WHERE 
        todo LIKE '%${search_q}%'
        AND priority='${priority}';`
      break

    case hasstatusProperty(request.query):
      getTodosQuery = `
        SELECT * FROM todo
        WHERE
        todo LIKE '%${search_q}%'
        AND status ='${status}';`
      break
    default:
      getTodosQuery = ` 
        SELECT * FROM todo 
        WHERE todo LIKE '%${search_q}%';`
  }
  data = await db.all(getTodosQuery)
  response.send(data)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
  SELECT *
  FROM todo
  where
   id=${todoId};`
  const todo = await db.get(getTodoQuery)
  response.send(todo)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postTodoQuery = `
  INSERT INTO todo(id,todo,priority,status)
  VALUES
   (${id},'${todo}','${priority}','${status}');`
  await db.run(postTodoQuery)
  response.send('Todo Successfully Added')
})
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updatecolumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updatecolumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updatecolumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updatecolumn = 'Todo'
      break
  }
  const previousTodoQuery = `
  SELECT *
  FROM todo
  WHERE 
  id=${todoId};`
  const previousTodo = await db.get(previousTodoQuery)
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body

  const updateTodoQuery = `
UPDATE todo
SET 
todo='${todo}',
priority='${priority}',
status='${status}'
WHERE 
id=${todoId};`

  await db.run(updateTodoQuery)
  response.send(`${updatecolumn} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE FROM 
  todo
  WHERE id=${todoId};`

  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
