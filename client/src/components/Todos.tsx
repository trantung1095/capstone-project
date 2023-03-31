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

const LIMIT_OPTIONS = [
  { key: '3', value: 3, text: '3 items per page' },
  { key: '6', value: 6, text: '6 items per page' },
  { key: '12', value: 12, text: '12 items per page' },
  { key: '24', value: 24, text: '24 items per page' }
]

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
  openEditPopup: boolean
  editItem: Todo
  nextKey: string
  limit: number
  nextKeyList: string[]
  currentKey: string
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    loadingTodos: true,
    openEditPopup: false,
    editItem: {} as Todo,
    nextKey: '',
    limit: 6,
    nextKeyList: [],
    currentKey: ''
  }

  username = localStorage
    .getItem('username')
    ?.replace(/['"]+/g, '')
    .toUpperCase()

  setLimit(limit: number) {
    this.setState({ nextKeyList: [], limit, nextKey: '' })
    this.getTodos(limit, '')
  }

  handleToggleEditPopup(openEditPopup: boolean) {
    this.setState({ openEditPopup })
  }

  onClickNextButton() {
    console.log('Next button', this.state.nextKeyList)
    var nextKeyList = this.state.nextKeyList
    nextKeyList.push(this.state.currentKey)
    this.setState({ nextKeyList })

    this.getTodos(this.state.limit, this.state.nextKey)
  }

  onClickPrevButton() {
    var nextKeyList = this.state.nextKeyList
    var preKey = nextKeyList.pop()
    this.setState({ nextKeyList })

    this.getTodos(this.state.limit, preKey)
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  onEditButtonClick = (todo: Todo) => {
    console.log('Edit to do,', todo)
    this.setState({ editItem: todo, openEditPopup: true })
  }

  handleCreateTodo = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        dueDate
      })
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: ''
      })
    } catch {
      alert('Todo creation failed')
    }
  }

  handleDeleteTodo = async (todoId: string) => {
    try {
      if (!window.confirm('Do you want to delete this todo?')) return

      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter((todo) => todo.todoId !== todoId)
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
        isUpdateImage: false // Default is false
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

  async getTodos(limit?: number, nextKey?: string) {
    try {
      if (limit === undefined || limit === null) {
        limit = this.state.limit
      }
      if (nextKey === undefined || nextKey === null) {
        nextKey = ''
      }

      this.setState({
        loadingTodos: true,
        currentKey: nextKey
      })

      const result = await getTodos(
        this.props.auth.getIdToken(),
        limit,
        nextKey
      )

      this.setState({
        todos: result.items,
        nextKey: result.nextKey ?? '',
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
          onClick={() => this.onClickPrevButton()}
          disabled={this.state.nextKeyList.length === 0}
        />
        <Button
          primary
          content="Next"
          icon="right arrow"
          labelPosition="right"
          loading={this.state.loadingTodos}
          onClick={() => this.onClickNextButton()}
          disabled={this.state.nextKeyList.length === 0}
        />
        <Select
          placeholder="Page size"
          style={{ marginRight: '10px' }}
          options={LIMIT_OPTIONS}
          value={this.state.limit}
          onChange={(e, data) => this.setLimit(Number(data.value))}
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
              onClick: this.handleCreateTodo
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
              onClick={() => this.onEditButtonClick(todo)}
            >
              <Icon name="pencil" />
            </Button>
            <Button
              icon
              color="red"
              onClick={() => this.handleDeleteTodo(todo.todoId)}
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
