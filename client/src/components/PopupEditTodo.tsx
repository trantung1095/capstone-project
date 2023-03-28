import * as React from 'react'
import { Form, Button, Checkbox, Modal, Image } from 'semantic-ui-react'
import Auth from '../auth/Auth'
import { deleteImage, patchTodo, uploadFile } from '../api/todos-api'
import { Todo } from '../types/Todo'
import { UpdateTodoRequest } from '../types/UpdateTodoRequest'

enum UploadState {
  NoUpload,
  SavingData,
  UploadingFile
}

interface EditTodoProps {
  item: Todo
  display: boolean
  closeFunction: Function
  auth: Auth
}

interface EditTodoState {
  file: any
  uploadState: UploadState
  name: string
  dueDate: string
  done: boolean
}

export class PopupEditTodo extends React.PureComponent<
  EditTodoProps,
  EditTodoState
> {
  state: EditTodoState = {
    file: undefined,
    uploadState: UploadState.NoUpload,
    name: this.props.item.name,
    dueDate: this.props.item.dueDate,
    done: this.props.item.done
  }

  setTodoDueDate(newValue: string) {
    var dueDate = newValue
    this.setState({ dueDate })
  }

  setTodoName(newValue: string) {
    var name = newValue
    this.setState({ name })
  }

  setTodoDone(newValue: boolean) {
    var done = newValue
    this.setState({ done })
  }

  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    this.setState({
      file: files[0]
    })
  }

  onImageDelete = async (todoId: string) => {
    try {
      if (!window.confirm('Do you want to delete this image?')) return

      await deleteImage(this.props.auth.getIdToken(), todoId)
      this.props.closeFunction()
    } catch {
      alert('Image deletion failed')
    }
  }

  handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      const updateModel: UpdateTodoRequest = {
        name: this.state.name,
        dueDate: this.state.dueDate,
        done: this.state.done,
        uploadImage: this.state.file !== undefined
      }

      console.log('Patch API Todo', updateModel)

      this.setUploadState(UploadState.SavingData)
      const uploadUrl: string = await patchTodo(
        this.props.auth.getIdToken(),
        this.props.item.todoId,
        updateModel
      )

      // Upload file (if needed)
      if (this.state.file) {
        this.setUploadState(UploadState.UploadingFile)
        await uploadFile(uploadUrl, this.state.file)
      }

      alert('Save success!')
      this.props.closeFunction()
    } catch (e) {
      alert('Could not save to do, error message: ' + (e as Error).message)
    } finally {
      this.setUploadState(UploadState.NoUpload)
    }
  }

  setUploadState(uploadState: UploadState) {
    this.setState({
      uploadState
    })
  }

  render() {
    return (
      <Modal
        onClose={() => this.props.closeFunction()}
        open={this.props.display}
      >
        <Modal.Header>Edit todo</Modal.Header>
        <Modal.Content image>
          {this.props.item && this.props.item.attachmentUrl && (
            <div style={{ margin: '20px' }}>
              <Image
                size="medium"
                src={this.props.item.attachmentUrl}
                wrapped
              />
              <Button
                basic
                color="red"
                fluid
                style={{ marginTop: '5px' }}
                onClick={() => this.onImageDelete(this.props.item.todoId)}
              >
                Remove Todo Image
              </Button>
            </div>
          )}
          <Modal.Description>
            <Form onSubmit={this.handleSubmit}>
              <Form.Field>
                <label>Task</label>
                <input
                  placeholder="Task"
                  value={this.state.name}
                  onChange={(e) => this.setTodoName(e.target.value)}
                />
              </Form.Field>
              <Form.Field>
                <label>Due date</label>
                <input
                  type="date"
                  value={this.state.dueDate}
                  onChange={(e) => this.setTodoDueDate(e.target.value)}
                />
              </Form.Field>
              <Form.Field>
                <Checkbox
                  label="Mark done"
                  checked={this.state.done}
                  onChange={(e, data) =>
                    this.setTodoDone(data.checked === true)
                  }
                />
              </Form.Field>

              <Form.Field>
                <label>
                  Upload Image (your image will be resize to reduce size after
                  upload)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  placeholder="Image to upload"
                  onChange={this.handleFileChange}
                />
              </Form.Field>

              {this.renderButton()}
            </Form>
          </Modal.Description>
        </Modal.Content>
      </Modal>
    )
  }

  renderButton() {
    return (
      <div>
        {this.state.uploadState === UploadState.SavingData && (
          <p>Saving data</p>
        )}
        {this.state.uploadState === UploadState.UploadingFile && (
          <p>Uploading image</p>
        )}

        <Button color="black" onClick={() => this.props.closeFunction()}>
          Close
        </Button>
        <Button
          primary
          loading={this.state.uploadState !== UploadState.NoUpload}
          type="submit"
        >
          Save
        </Button>
      </div>
    )
  }
}
