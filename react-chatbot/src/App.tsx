import React from 'react'
import ChatComponent from './components/chatComponent'

const App: React.FunctionComponent = () => {
  return (
    <div className='max-w-lg mt-20 mx-auto bg-white shadow-md rounded-lg p-6 overflow-hidden'>
      <div className='w-full max-w-lg bg-white shadow-lg rounded-lg p-6 overflow-hidden'>
        <ChatComponent />
      </div>
    </div>
  )
}

export default App;