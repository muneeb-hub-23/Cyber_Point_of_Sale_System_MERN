import React from 'react'

const Switcherx = ({enabled,setEnabled,id}) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex cursor-pointer select-none items-center"
      >
        <div className="relative">
          <input
            type="checkbox"
            id={id}
            value={!enabled}
            className="!bg-rose-600 sr-only"
            onChange={(e) => {
              setEnabled(!enabled);
            }}
          />
          <div className={`block h-8 w-14 ${!enabled ? 'bg-rose-600':'bg-green-500'} rounded-full`}></div>
          <div
            className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition ${
              enabled && "!right-1 !translate-x-full !bg-white dark:!bg-white"
            }`}
          ></div>
        </div>
      </label>
    </div>
  )
}

export default Switcherx
