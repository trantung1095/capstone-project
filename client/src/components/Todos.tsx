import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Loader,
  Select,
  Container,
  Table,
  Image
} from 'semantic-ui-react'

import { createTodo, deleteTodo, getTodos, patchTodo } from '../api/todos-api'
import Auth from '../auth/Auth'
import { GetTodosRequest } from '../types/GetTodosRequest'
import { Todo } from '../types/Todo'
import defaultImage from '../assets/images/default-image.jpeg'
import { PopupEditTodo } from './PopupEditTodo'

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
  param: GetTodosRequest
  nextKeyList: string[]
  editItem: Todo
  openEditPopup: boolean
}

const LIMIT_OPTIONS = [
  { key: '5', value: 5, text: '5 items per page' },
  { key: '10', value: 10, text: '10 items per page' },
  { key: '15', value: 15, text: '15 items per page' }
]

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    loadingTodos: true,
    param: {
      nextKey: '',
      limit: 5
    },
    nextKeyList: [],
    editItem: {} as Todo,
    openEditPopup: false
  }

  username = localStorage
    .getItem('username')
    ?.replace(/['"]+/g, '')
    .toUpperCase()

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  handleEditButtonClick = (todo: Todo) => {
    console.log('Edit to do,', todo)
    this.setState({ editItem: todo, openEditPopup: true })
  }

  handleToggleEditPopup(openEditPopup: boolean) {
    this.setState({ openEditPopup })
  }

  handleTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        dueDate
      })
      this.setState({
        loadingTodos: true,
        newTodoName: '',
        nextKeyList: [],
        param: {
          ...this.state.param,
          nextKey: ''
        }
      })
    } catch {
      alert('Todo creation failed')
    }
  }

  handleTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        loadingTodos: true,
        nextKeyList: [],
        param: {
          ...this.state.param,
          nextKey: ''
        }
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  handleTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done,
        uploadImage: false
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  handleClickNextButton() {
    this.state.nextKeyList.push(this.state.param.nextKey)
    this.setState({ loadingTodos: true })
  }

  handleClickPreviousButton() {
    this.state.nextKeyList.pop()
    this.setState({
      param: {
        ...this.state.param,
        nextKey: this.state.nextKeyList.at(-1) || ''
      },
      loadingTodos: true
    })
  }

  onChangeLimit = (newLimit: number) => {
    this.setState({
      loadingTodos: true,
      nextKeyList: [],
      param: {
        ...this.state.param,
        limit: newLimit,
        nextKey: ''
      }
    })
  }

  async getTodos() {
    try {
      const result = await getTodos(
        this.props.auth.getIdToken(),
        this.state.param
      )
      console.log(result)

      this.setState({
        todos: result.items,
        param: {
          ...this.state.param,
          nextKey: result.nextKey ?? ''
        },
        loadingTodos: false
      })
    } catch (e) {
      alert(`Failed to fetch todos: ${(e as Error).message}`)
    }
  }

  async componentDidMount() {
    await this.getTodos()
  }

  async componentDidUpdate(prevProps: any, prevState: TodosState) {
    if (
      this.state.loadingTodos !== prevState.loadingTodos &&
      this.state.loadingTodos
    ) {
      await this.getTodos()
    }
  }

  render() {
    console.log(this.state.param)
    console.log(this.state.nextKeyList)
    return (
      <div>
        <Header as="h1">{this.username} todos</Header>

        {this.renderCreateTodoInput()}
        {this.renderTodos()}
        {this.renderPaginator()}
        {this.state.openEditPopup && (
          <PopupEditTodo
            display={this.state.openEditPopup}
            closeFunction={() => {
              this.handleToggleEditPopup(false)
              this.setState({ loadingTodos: true })
              this.getTodos()
            }}
            item={this.state.editItem}
            auth={this.props.auth}
          />
        )}
      </div>
    )
  }

  renderPaginator() {
    return (
      <Container style={{ paddingBottom: '15px', textAlign: 'right' }}>
        <Button
          primary
          content="Previous"
          icon="left arrow"
          labelPosition="left"
          loading={this.state.loadingTodos}
          onClick={() => this.handleClickPreviousButton()}
          disabled={this.state.nextKeyList.length === 0}
        />
        <Button
          primary
          content="Next"
          icon="right arrow"
          labelPosition="right"
          loading={this.state.loadingTodos}
          onClick={() => this.handleClickNextButton()}
          disabled={
            this.state.param.nextKey === null || this.state.param.nextKey === ''
          }
        />
        <Select
          placeholder="Page size"
          style={{ marginRight: '10px' }}
          options={LIMIT_OPTIONS}
          value={this.state.param.limit}
          onChange={(e, data) => this.onChangeLimit(Number(data.value))}
        />
      </Container>
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New task',
              onClick: this.handleTodoCreate
            }}
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderTodos() {
    if (this.state.loadingTodos || !this.state.todos) {
      return this.renderLoading()
    }

    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderTableRow() {
    return this.state.todos.map((todo, pos) => (
      <Table.Row key={pos}>
        <Table.Cell>
          <Image
            src={todo.attachmentUrl ? todo.attachmentUrl : defaultImage}
            size="tiny"
          />
        </Table.Cell>
        <Table.Cell>{todo.name}</Table.Cell>
        <Table.Cell>
          <span className="cinema">{todo.dueDate}</span>
        </Table.Cell>
        <Table.Cell>
          <Checkbox
            label="Mark done"
            onChange={() => this.handleTodoCheck(pos)}
            checked={todo.done}
          />{' '}
        </Table.Cell>
        <Table.Cell>
          <Button.Group floated="right" size="mini">
            <Button
              icon
              color="blue"
              onClick={() => this.handleEditButtonClick(todo)}
            >
              <Icon name="pencil" />
            </Button>
            <Button
              icon
              color="red"
              onClick={() => this.handleTodoDelete(todo.todoId)}
            >
              <Icon name="delete" />
            </Button>
          </Button.Group>
        </Table.Cell>
      </Table.Row>
    ))
  }

  renderTodosList() {
    return (
      <Table compact celled>
        <Table.Header fullWidth>
          <Table.Row>
            <Table.HeaderCell>Image</Table.HeaderCell>
            <Table.HeaderCell>Task</Table.HeaderCell>
            <Table.HeaderCell>Due date</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>{this.renderTableRow()}</Table.Body>
        <Table.Footer fullWidth>
          <Table.Row>
            <Table.HeaderCell colSpan={5} />
          </Table.Row>
        </Table.Footer>
      </Table>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
