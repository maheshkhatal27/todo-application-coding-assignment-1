const express = require("express");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const isMatch = require("date-fns/isMatch");
const { format } = require("date-fns");
const app = express();
app.use(express.json());

const arrayOfStatus = ["TO DO", "DONE", "IN PROGRESS"];
const arrayOfCategory = ["WORK", "HOME", "LEARNING"];
const arrayOfPriority = ["HIGH", "MEDIUM", "LOW"];

let db = null;
const dbPath = path.join(__dirname, "todoApplication.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1- GET
//Returns list of all todos whose status is todo
///todos/?status=TO%20DO
app.get("/todos/", async (request, response) => {
  //if not searh_q will get default value
  //now look for request.qyery,not params

  const { search_q = "", status, priority, todo, category } = request.query;
  // console.log(request.query);

  /*const arrayOfStatus = ["TO DO", "DONE", "IN PROGRESS"];
  const arrayOfCategory = ["WORK", "HOME", "LEARNING"];
  const arrayOfPriority = ["HIGH", "MEDIUM", "LOW"];*/
  const getAllTodoQuery = `
  SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE status 
  like '%${status}%';`;

  const getHighPriorityQuery = `
 SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE priority 
 like '%${priority}%';`;

  const getHighPrioAndInProgressQuery = `
SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE status 
like '%${status}%' and priority 
 like '%${priority}%';`;

  //console.log(request.query);

  const getBuyTypeRecordsQuery = `
 SELECT id,todo,priority,status,category,due_date as dueDate from todo WHERE todo like 
 '%${search_q}%';`;

  const getCategoryWorkStatusDoneQuery = `
SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE category
like '%${category}%' and status
 like '%${status}%';`;

  const getHomeCategoryQuery = `
SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE category like '%${category}%';`;

  const getLearningCategoryHighPriorityQuery = `
SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE category like '%${category}%' and priority like 
'%${priority}%';`;

  switch (true) {
    //scenario 3
    case priority !== undefined && status != undefined:
      //console.log("high priority and in progress");
      if (arrayOfPriority.includes(priority)) {
        if (arrayOfStatus.includes(status)) {
          if (
            arrayOfPriority.includes(priority) &&
            arrayOfStatus.includes(status)
          ) {
            const listHighPriorityInprogress = await db.all(
              getHighPrioAndInProgressQuery
            );
            response.send(listHighPriorityInprogress);
          }
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //scenario 5-category work and status is done
    case category !== undefined && status !== undefined:
      if (arrayOfCategory.includes(category)) {
        if (arrayOfStatus.includes(status)) {
          const workDoneResponse = await db.all(getCategoryWorkStatusDoneQuery);
          response.send(workDoneResponse);
        } else {
          response.status(400);
          response.send("Invalid Todo category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //scenario- 7 category is learning and priority is high
    case category !== undefined && priority !== undefined:
      if (arrayOfCategory.includes(category)) {
        if (arrayOfPriority.includes(priority)) {
          const learnHighPriorityResponse = await db.all(
            getLearningCategoryHighPriorityQuery
          );
          response.send(learnHighPriorityResponse);
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //scenario 2
    case priority !== undefined:
      // console.log("high priority");
      if (arrayOfPriority.includes(priority)) {
        const listOfHighPrioritytodos = await db.all(getHighPriorityQuery);
        response.send(listOfHighPrioritytodos);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //scenario 4
    case search_q === "Buy":
      const buyTypeRecords = await db.all(getBuyTypeRecordsQuery);
      response.send(buyTypeRecords);
      break;

    //scenario-6 cat is  home
    case category !== undefined:
      if (arrayOfCategory.includes(category)) {
        const homeCategoryResponse = await db.all(getHomeCategoryQuery);
        response.send(homeCategoryResponse);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      if (status === "TO DO") {
        const allToDoList = await db.all(getAllTodoQuery);
        response.send(allToDoList);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
  } //switch ends here
});

//API 2 returns a specific todo
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificTodoQuery = `
        SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE 
        id=${todoId};`;
  const todoItem = await db.get(getSpecificTodoQuery);
  response.send(todoItem);
});
//API 4 Create a todo in the todo table,
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (arrayOfPriority.includes(priority)) {
    if (arrayOfStatus.includes(status)) {
      if (arrayOfCategory.includes(category)) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const createDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const addTodoQuery = `
  INSERT INTO
    todo (id, todo, category,priority, status, due_date)
  VALUES
    (${id}, '${todo}', '${category}','${priority}', '${status}', '${createDueDate}');`;
          await db.run(addTodoQuery);
          //console.log(responseResult);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5 Updates the details of a specific todo based on the todo ID
//total 5 scenarios
app.put("/todos/:todoId/", async (request, response) => {
  const { status, priority, todo, category, dueDate } = request.body;
  const { todoId } = request.params;
  const updateStatusQuery = `
    UPDATE todo 
    SET status='${status}' 
    WHERE id=${todoId};`;

  const updatePriorityQuery = `
    UPDATE todo 
    SET priority='${priority}' 
    WHERE id=${todoId};`;

  const updateTodoQuery = `
    UPDATE todo 
    SET todo='${todo}' 
    WHERE id=${todoId};`;

  const updateCategoryQuery = `
  UPDATE todo SET category='${category}' 
  WHERE id=${todoId};`;
  //formatDate first and then use inside

  switch (true) {
    case status !== undefined:
      if (arrayOfStatus.includes(status)) {
        const updateStatusResponse = await db.run(updateStatusQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case priority !== undefined:
      if (arrayOfPriority.includes(priority)) {
        const updateStatusResponse = await db.run(updatePriorityQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case todo !== undefined:
      const updateStatusResponse = await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;

    case category !== undefined:
      if (arrayOfCategory.includes(category)) {
        const updateCategoryResponse = await db.run(updateCategoryQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const formatDate = format(new Date(dueDate), "yyyy-MM-dd");
        const updateDateQuery = `UPDATE todo SET 
        due_date='${formatDate}' WHERE id=${todoId};`;
        const dateReponse = await db.run(updateDateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
  }
});

//API6-Deletes a todo from the todo table based on the todo ID

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id=${todoId};`;

  const deleteResponse = await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

//API 3 Agenda
//Returns a list of all todos with a specific due date in the query parameter /agenda/?date=2021-12-12

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  //console.log(date);
  if (isMatch(date, "yyyy-MM-dd")) {
    const formatDate = format(new Date(date), "yyyy-MM-dd");
    const getSpecificDateTodoQuery = `SELECT id,todo,
  status,priority,category,due_date as dueDate FROM todo 
  WHERE due_date='${formatDate}';`;
    const dateChkResponse = await db.all(getSpecificDateTodoQuery);
    response.send(dateChkResponse);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

module.exports = app;
