## Overview ##

nPool is a platform independent, unit of work based, thread pool add-on for Node.js.

nPool's primary features and benefits include:

 * Efficient and straightforward interface
 * Transparent marshalling of javascript objects in and out of the thread pool
 * User defined context of the callback function executed after task completion
 * Use of object types to complete units of work
 * Support for UTF-8 strings

## Supported Platforms ##

Mac OS X (Tested on Mac OS X 10.8.4)  
Windows (Tested on Windows 8 x64 Professional)  
Linux (Tested on Debian 7.0 Wheezy 3.2.46-1 x86_64)

## The Implementation ##

nPool is written entirely in C/C++.  The thread pool and synchronization frameworks are written in C and the Node.js/V8 add-on interface is written in C++.  The library has no third-party dependencies other than Node.js and V8.

The cross-platform threading component utilizes POSIX threads for Mac and Unix.  On Windows, native threads and critical sections are used.  Work is performed via a FIFO queue that is processed by the thread pool following a unit of work pattern.  Each thread within the thread pool utilizes a distinct V8 isolate to execute javascript parallely.  Callbacks to the main Node.js thread are coordinated via libuv’s async inter-thread communication mechanism.

One thing to note, unordered_maps are used within the add-on interface, therefore, it is necessary that the platform of choice provides C++11 (Windows and Linux) or TR1 (Apple) implementations of the standard library.

## API Documentation ##

nPool provides a very simple and efficient interface.  There are a total of 5 functions:

1. `createThreadPool`
2. `destroyThreadPool`
3. `loadFile`
4. `removeFile`
5. `queueWorkUnit`

### Functions

1. `createThreadPool(numThreads)`
 
 This function creates the thread pool.  At this time, the module only supports one thread pool per Node.js process.  Therefore, this function should only be called once, prior to `queueWork` or `destroyThreadPool`.

 The function takes one parameter:

 * `numThreads` (uint32) - number of threads to create within the thread pool

 Example:

 ```javascript
// create thread pool with two threads
nPool.createThreadPool(2);
```

---

2. `destroyThreadPool()`

 This function destroys the thread pool.  This function should only be called once and only when there will be no subsequent calls to the queueWorkUnit function.  This method can be called safely even if there are tasks still in progress.  At a lower level, this actually signals all threads to exit, but causes the main thread to block until all threads finish their currently executing in-progress units of work.  This does block the main Node.js thread, so this should only be executed when the process is terminating.

 This function takes no parameters.

 Example:

 ```javascript
// destroy the thread pool
nPool.destroyThreadPool();
```

 ---

3. `loadFile(fileKey, filePath)`

 This function serializes a javascript file that contains a constructor function for an object type.  The file buffer will be cached on the Node.js main thread.

 Each thread, on first execution with a unit of work which requires the file referenced by fileKey, will de-serialize and compile the contents into a V8 function. The function is used to instantiate a new persistent V8 object instance of the object type.  The persistent object instance is then cached per thread.  Every subsequent unit of work referencing the fileKey will retrieve the already cached object instance.

 This function can be called at any time.  It should be noted that this is a synchronous call, so the serialization of the file will occur on the main thread of the Node.js process.  That being said, it would be prudent to load all necessary files at process startup, especially since they will be cached in memory.

 This function takes two parameters:

 * `fileKey` (uint32) - uniquely identifies a file
 * `filePath` (string) - path to javascript file to be cached

 Each file must have a unique key.

 Example:

 ```javascript
// load files defining object types
nPool.loadFile(1, './fileA.js');
nPool.loadFile(2, './fileB.js');
```

 ---

4. `removeFile(fileKey)`

 This function removes a javascript file from the file cache.  This function can be called at any time, with one caveat.  The user should take care to not remove files that are currently referenced in pending units of work that have yet to be processed by the thread pool.

 This function takes one parameter:

 * `fileKey` (uint32) - unique key for a loaded file

 There must exist a file for the given key.

 Example:

 ```javascript
// remove file associated with fileKey: 1
nPool.removeFile(1);
```

 ---

5. `queueWorkUnit(unitOfWorkObject)`

 This function queues a unit of work for execution on the thread pool.  This function should be called after createThreadPool and prior to destroyThreadPool.

 The function takes one parameter, a unit of work object which contains specific and required properties.

 A `unitOfWorkObject` contains the following named properties:

 * `workId` (uint32) - This parameter is a unique integer that identifies a unit of work.  This integer is later passed as a parameter to the work complete callback function.

 * `fileKey` (uint32) - This parameter is an integer that is used as a key to reference a file that was previously cached via the loadFile function.  At this time there is no run-time logic to handle the a case when a file key does not reference a previously loaded file.  Therefore, ensure that a file exists for the given key.

 * `workFunction` (string) - This parameter is a string that declares the name of a function.  This function name will be used in conjunction with the fileKey in order to reference a specific object instance method.   The function name must match a method on the object type that is defined by the file associated with the given fileKey.  The method will be called from within a background thread to process the unit of work object passed to queueWork.

 * `workParam` (object) - This is user defined object that defines a unit of work.  The object will be passed as the only parameter to the object instance method that is executed in the thread pool.  Any function properties on the object will not be available when it is used in the thread pool because serialization does not support packing functions.

 * `callbackFunction` (function) - This property specifies the work complete callback function.  The function is executed on the main Node.js thread.
The work complete callback function takes two parameters:
object callbackObject - the object that is returned by the workFunction
uint32 workId -  the unique identifier, workId, that was passed with the unit of work when it was queued

 * `callbackContext` (context) - This property specifies the context (`this`) of the callbackFunction when it is called.

 ```js
// create the unit of work object
var unitOfWork = {

	// unique identifer of unit of work
	workId: 34290,

	// object type file
	fileKey: 1,

	// object instance function to perform unit of work
	workFunction: objectMethod,

	// object to be passed to work function
	workParam: {
		arrayProperty: [ ... ],
		objectProperty: { ... },
		valueProperty: 123,
    	stringProperty: "abcd"
  	},

	// function that will be called on main Node.js when the task is complete
  	callbackFunction: fibonacciCallbackFunction,

  	// context that the unit of work function will be called in
  	callbackContext: someOtherObject
};

// queue the unit of work
nPool.queueWork(unitOfWork);
```