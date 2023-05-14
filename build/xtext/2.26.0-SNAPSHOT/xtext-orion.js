/*******************************************************************************
 * Copyright (c) 2015 itemis AG (http://www.itemis.eu) and others.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *******************************************************************************/

define('xtext/compatibility',[], function() {
	
	if (!Function.prototype.bind) {
		Function.prototype.bind = function(target) {
			if (typeof this !== 'function')
				throw new TypeError('bind target is not callable');
			var args = Array.prototype.slice.call(arguments, 1);
			var unboundFunc = this;
			var nopFunc = function() {};
			boundFunc = function() {
				var localArgs = Array.prototype.slice.call(arguments);
				return unboundFunc.apply(this instanceof nopFunc ? this : target,
						args.concat(localArgs));
			};
			nopFunc.prototype = this.prototype;
			boundFunc.prototype = new nopFunc();
			return boundFunc;
		}
	}
	
	if (!Array.prototype.map) {
		Array.prototype.map = function(callback, thisArg) {
			if (this == null)
				throw new TypeError('this is null');
			if (typeof callback !== 'function')
				throw new TypeError('callback is not callable');
			var srcArray = Object(this);
			var len = srcArray.length >>> 0;
			var tgtArray = new Array(len);
			for (var i = 0; i < len; i++) {
				if (i in srcArray)
					tgtArray[i] = callback.call(thisArg, srcArray[i], i, srcArray);
			}
			return tgtArray;
		}
	}
	
	if (!Array.prototype.forEach) {
		Array.prototype.forEach = function(callback, thisArg) {
			if (this == null)
				throw new TypeError('this is null');
			if (typeof callback !== 'function')
				throw new TypeError('callback is not callable');
			var srcArray = Object(this);
			var len = srcArray.length >>> 0;
			for (var i = 0; i < len; i++) {
				if (i in srcArray)
					callback.call(thisArg, srcArray[i], i, srcArray);
			}
		}
	}
	
	return {};
});

/*******************************************************************************
 * Copyright (c) 2015, 2017 itemis AG (http://www.itemis.eu) and others.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *******************************************************************************/

define('xtext/services/XtextService',['jquery'], function(jQuery) {
	
	var globalState = {};
	
	/**
	 * Generic service implementation that can serve as superclass for specialized services.
	 */
	function XtextService() {};

	/**
	 * Initialize the request metadata for this service class. Two variants:
	 *  - initialize(serviceUrl, serviceType, resourceId, updateService)
	 *  - initialize(xtextServices, serviceType)
	 */
	XtextService.prototype.initialize = function() {
		this._serviceType = arguments[1];
		if (typeof(arguments[0]) === 'string') {
			this._requestUrl = arguments[0] + '/' + this._serviceType;
			var resourceId = arguments[2];
			if (resourceId)
				this._encodedResourceId = encodeURIComponent(resourceId);
			this._updateService = arguments[3];
		} else {
			var xtextServices = arguments[0];
			if (xtextServices.options) {
				this._requestUrl = xtextServices.options.serviceUrl + '/' + this._serviceType;
				var resourceId = xtextServices.options.resourceId;
				if (resourceId)
					this._encodedResourceId = encodeURIComponent(resourceId);
			}
			this._updateService = xtextServices.updateService;
		}
	}
	
	XtextService.prototype.setState = function(state) {
		this._state = state;
	}
	
	/**
	 * Invoke the service with default service behavior.
	 */
	XtextService.prototype.invoke = function(editorContext, params, deferred, callbacks) {
		if (deferred === undefined) {
			deferred = jQuery.Deferred();
		}
		if (jQuery.isFunction(this._checkPreconditions) && !this._checkPreconditions(editorContext, params)) {
			deferred.reject();
			return deferred.promise();
		}
		var serverData = {
			contentType: params.contentType
		};
		var initResult;
		if (jQuery.isFunction(this._initServerData))
			initResult = this._initServerData(serverData, editorContext, params);
		var httpMethod = 'GET';
		if (initResult && initResult.httpMethod)
			httpMethod = initResult.httpMethod;
		var self = this;
		if (!(initResult && initResult.suppressContent)) {
			if (params.sendFullText) {
				serverData.fullText = editorContext.getText();
				httpMethod = 'POST';
			} else {
				var knownServerState = editorContext.getServerState();
				if (knownServerState.updateInProgress) {
					if (self._updateService) {
						self._updateService.addCompletionCallback(function() {
							self.invoke(editorContext, params, deferred);
						});
					} else {
						deferred.reject();
					}
					return deferred.promise();
				}
				if (knownServerState.stateId !== undefined) {
					serverData.requiredStateId = knownServerState.stateId;
				}
			}
		}
		
		var onSuccess;
		if (jQuery.isFunction(this._getSuccessCallback)) {
			onSuccess = this._getSuccessCallback(editorContext, params, deferred);
		} else {
			onSuccess = function(result) {
				if (result.conflict) {
					if (self._increaseRecursionCount(editorContext)) {
						var onConflictResult;
						if (jQuery.isFunction(self._onConflict)) {
							onConflictResult = self._onConflict(editorContext, result.conflict);
						}
						if (!(onConflictResult && onConflictResult.suppressForcedUpdate) && !params.sendFullText
								&& result.conflict == 'invalidStateId' && self._updateService) {
							self._updateService.addCompletionCallback(function() {
								self.invoke(editorContext, params, deferred);
							});
							var knownServerState = editorContext.getServerState();
							delete knownServerState.stateId;
							delete knownServerState.text;
							self._updateService.invoke(editorContext, params);
						} else {
							self.invoke(editorContext, params, deferred);
						}
					} else {
						deferred.reject();
					}
					return false;
				}
				if (jQuery.isFunction(self._processResult)) {
					var processedResult = self._processResult(result, editorContext);
					if (processedResult) {
						deferred.resolve(processedResult);
						return true;
					}
				}
				deferred.resolve(result);
			};
		}
		
		var onError = function(xhr, textStatus, errorThrown) {
			if (xhr.status == 404 && !params.loadFromServer && self._increaseRecursionCount(editorContext)) {
				var onConflictResult;
				if (jQuery.isFunction(self._onConflict)) {
					onConflictResult = self._onConflict(editorContext, errorThrown);
				}
				var knownServerState = editorContext.getServerState();
				if (!(onConflictResult && onConflictResult.suppressForcedUpdate)
						&& knownServerState.text !== undefined && self._updateService) {
					self._updateService.addCompletionCallback(function() {
						self.invoke(editorContext, params, deferred);
					});
					delete knownServerState.stateId;
					delete knownServerState.text;
					self._updateService.invoke(editorContext, params);
					return true;
				}
			}
			deferred.reject(errorThrown);
		}
		
		self.sendRequest(editorContext, {
			type: httpMethod,
			data: serverData,
			success: onSuccess,
			error: onError
		}, !params.sendFullText);
		return deferred.promise().always(function() {
			self._recursionCount = undefined;
		});
	}

	/**
	 * Send an HTTP request to invoke the service.
	 */
	XtextService.prototype.sendRequest = function(editorContext, settings, needsSession) {
		var self = this;
		self.setState('started');
		var corsEnabled = editorContext.xtextServices.options['enableCors'];
		if(corsEnabled) {
			settings.crossDomain = true;
			settings.xhrFields = {withCredentials: true};
		} 
		var onSuccess = settings.success;
		settings.success = function(result) {
			var accepted = true;
			if (jQuery.isFunction(onSuccess)) {
				accepted = onSuccess(result);
			}
			if (accepted || accepted === undefined) {
				self.setState('finished');
				if (editorContext.xtextServices) {
					var successListeners = editorContext.xtextServices.successListeners;
					if (successListeners) {
						for (var i = 0; i < successListeners.length; i++) {
							var listener = successListeners[i];
							if (jQuery.isFunction(listener)) {
								listener(self._serviceType, result);
							}
						}
					}
				}
			}
		};
		
		var onError = settings.error;
		settings.error = function(xhr, textStatus, errorThrown) {
			var resolved = false;
			if (jQuery.isFunction(onError)) {
				resolved = onError(xhr, textStatus, errorThrown);
			}
			if (!resolved) {
				self.setState(undefined);
				self._reportError(editorContext, textStatus, errorThrown, xhr);
			}
		};
		
		settings.async = true;
		var requestUrl = self._requestUrl;
		if (!settings.data.resource && self._encodedResourceId) {
			if (requestUrl.indexOf('?') >= 0)
				requestUrl += '&resource=' + self._encodedResourceId;
			else
				requestUrl += '?resource=' + self._encodedResourceId;
		}
		
		if (needsSession && globalState._initPending) {
			// We have to wait until the initial request has finished to make sure the client has
			// received a valid session id
			if (!globalState._waitingRequests)
				globalState._waitingRequests = [];
			globalState._waitingRequests.push({requestUrl: requestUrl, settings: settings});
		} else {
			if (needsSession && !globalState._initDone) {
				globalState._initPending = true;
				var onComplete = settings.complete;
				settings.complete = function(xhr, textStatus) {
					if (jQuery.isFunction(onComplete)) {
						onComplete(xhr, textStatus);
					}
					delete globalState._initPending;
					globalState._initDone = true;
					if (globalState._waitingRequests) {
						for (var i = 0; i < globalState._waitingRequests.length; i++) {
							var request = globalState._waitingRequests[i];
							jQuery.ajax(request.requestUrl, request.settings);
						}
						delete globalState._waitingRequests;
					}
				}
			}
			jQuery.ajax(requestUrl, settings);
		}
	}
	
	/**
	 * Use this in case of a conflict before retrying the service invocation. If the number
	 * of retries exceeds the limit, an error is reported and the function returns false.
	 */
	XtextService.prototype._increaseRecursionCount = function(editorContext) {
		if (this._recursionCount === undefined)
			this._recursionCount = 1;
		else
			this._recursionCount++;

		if (this._recursionCount >= 10) {
			this._reportError(editorContext, 'warning', 'Xtext service request failed after 10 attempts.', {});
			return false;
		}
		return true;
	},
	
	/**
	 * Report an error to the listeners.
	 */
	XtextService.prototype._reportError = function(editorContext, severity, message, requestData) {
		if (editorContext.xtextServices) {
			var errorListeners = editorContext.xtextServices.errorListeners;
			if (errorListeners) {
				for (var i = 0; i < errorListeners.length; i++) {
					var listener = errorListeners[i];
					if (jQuery.isFunction(listener)) {
						listener(this._serviceType, severity, message, requestData);
					}
				}
			}
		}
	}
	
	return XtextService;
});

/*******************************************************************************
 * Copyright (c) 2015 itemis AG (http://www.itemis.eu) and others.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *******************************************************************************/

define('xtext/services/LoadResourceService',['xtext/services/XtextService', 'jquery'], function(XtextService, jQuery) {
	
	/**
	 * Service class for loading resources. The resulting text is passed to the editor context.
	 */
	function LoadResourceService(serviceUrl, resourceId, revert) {
		this.initialize(serviceUrl, revert ? 'revert' : 'load', resourceId);
	};

	LoadResourceService.prototype = new XtextService();
	
	LoadResourceService.prototype._initServerData = function(serverData, editorContext, params) {
		return {
			suppressContent: true,
			httpMethod: this._serviceType == 'revert' ? 'POST' : 'GET'
		};
	};
	
	LoadResourceService.prototype._getSuccessCallback = function(editorContext, params, deferred) {
		return function(result) {
			editorContext.setText(result.fullText);
			editorContext.clearUndoStack();
			editorContext.setDirty(result.dirty);
			var listeners = editorContext.updateServerState(result.fullText, result.stateId);
			for (var i = 0; i < listeners.length; i++) {
				listeners[i](params);
			}
			deferred.resolve(result);
		}
	}

	return LoadResourceService;
});
/*******************************************************************************
 * Copyright (c) 2015 itemis AG (http://www.itemis.eu) and others.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *******************************************************************************/

define('xtext/services/SaveResourceService',['xtext/services/XtextService', 'jquery'], function(XtextService, jQuery) {
	
	/**
	 * Service class for saving resources.
	 */
	function SaveResourceService(serviceUrl, resourceId) {
		this.initialize(serviceUrl, 'save', resourceId);
	};

	SaveResourceService.prototype = new XtextService();

	SaveResourceService.prototype._initServerData = function(serverData, editorContext, params) {
		return {
			httpMethod: 'POST'
		};
	};
	
	SaveResourceService.prototype._processResult = function(result, editorContext) {
		editorContext.setDirty(false);
	};
	
	return SaveResourceService;
});
/*******************************************************************************
 * Copyright (c) 2015 itemis AG (http://www.itemis.eu) and others.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *******************************************************************************/

define('xtext/services/HighlightingService',['xtext/services/XtextService', 'jquery'], function(XtextService, jQuery) {
	
	/**
	 * Service class for semantic highlighting.
	 */
	function HighlightingService(serviceUrl, resourceId) {
		this.initialize(serviceUrl, 'highlight', resourceId);
	};

	HighlightingService.prototype = new XtextService();
	
	HighlightingService.prototype._checkPreconditions = function(editorContext, params) {
		return this._state === undefined;
	}

	HighlightingService.prototype._onConflict = function(editorContext, cause) {
		this.setState(undefined);
		return {
			suppressForcedUpdate: true
		};
	};
	
	return HighlightingService;
});
/*******************************************************************************
 * Copyright (c) 2015 itemis AG (http://www.itemis.eu) and others.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *******************************************************************************/

define('xtext/services/ValidationService',['xtext/services/XtextService', 'jquery'], function(XtextService, jQuery) {
	
	/**
	 * Service class for validation.
	 */
	function ValidationService(serviceUrl, resourceId) {
		this.initialize(serviceUrl, 'validate', resourceId);
	};
	
	ValidationService.prototype = new XtextService();
	
	ValidationService.prototype._checkPreconditions = function(editorContext, params) {
		return this._state === undefined;
	}

	ValidationService.prototype._onConflict = function(editorContext, cause) {
		this.setState(undefined);
		return {
			suppressForcedUpdate: true
		};
	};
	
	return ValidationService;
});
/*******************************************************************************
 * Copyright (c) 2015 itemis AG (http://www.itemis.eu) and others.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *******************************************************************************/

define('xtext/services/UpdateService',['xtext/services/XtextService', 'jquery'], function(XtextService, jQuery) {
	
	/**
	 * Service class for updating the server-side representation of a resource.
	 * This service only makes sense with a stateful server, where an update request is sent
	 * after each modification. This can greatly improve response times compared to the
	 * stateless alternative, where the full text content is sent with each service request.
	 */
	function UpdateService(serviceUrl, resourceId) {
		this.initialize(serviceUrl, 'update', resourceId, this);
		this._completionCallbacks = [];
	};
	
	UpdateService.prototype = new XtextService();

	/**
	 * Compute a delta between two versions of a text. If a difference is found, the result
	 * contains three properties:
	 *   deltaText - the text to insert into s1
	 *   deltaOffset - the text insertion offset
	 *   deltaReplaceLength - the number of characters that shall be replaced by the inserted text
	 */
	UpdateService.prototype.computeDelta = function(s1, s2, result) {
		var start = 0, s1length = s1.length, s2length = s2.length;
		while (start < s1length && start < s2length && s1.charCodeAt(start) === s2.charCodeAt(start)) {
			start++;
		}
		if (start === s1length && start === s2length) {
			return;
		}
		result.deltaOffset = start;
		if (start === s1length) {
			result.deltaText = s2.substring(start, s2length);
			result.deltaReplaceLength = 0;
			return;
		} else if (start === s2length) {
			result.deltaText = '';
			result.deltaReplaceLength = s1length - start;
			return;
		}
		
		var end1 = s1length - 1, end2 = s2length - 1;
		while (end1 >= start && end2 >= start && s1.charCodeAt(end1) === s2.charCodeAt(end2)) {
			end1--;
			end2--;
		}
		result.deltaText = s2.substring(start, end2 + 1);
		result.deltaReplaceLength = end1 - start + 1;
	};
	
	/**
	 * Invoke all completion callbacks and clear the list afterwards.
	 */
	UpdateService.prototype.onComplete = function(xhr, textStatus) {
		var callbacks = this._completionCallbacks;
		this._completionCallbacks = [];
		for (var i = 0; i < callbacks.length; i++) {
			var callback = callbacks[i].callback;
			var params = callbacks[i].params;
			callback(params);
		}
	}
	
	/**
	 * Add a callback to be invoked when the service call has completed.
	 */
	UpdateService.prototype.addCompletionCallback = function(callback, params) {
		this._completionCallbacks.push({callback: callback, params: params});
	}

	UpdateService.prototype.invoke = function(editorContext, params, deferred) {
		if (deferred === undefined) {
			deferred = jQuery.Deferred();
		}
		var knownServerState = editorContext.getServerState();
		if (knownServerState.updateInProgress) {
			var self = this;
			this.addCompletionCallback(function() { self.invoke(editorContext, params, deferred) });
			return deferred.promise();
		}
		
		var serverData = {
			contentType: params.contentType
		};
		var currentText = editorContext.getText();
		if (params.sendFullText || knownServerState.text === undefined) {
			serverData.fullText = currentText;
		} else {
			this.computeDelta(knownServerState.text, currentText, serverData);
			if (serverData.deltaText === undefined) {
				if (params.forceUpdate) {
					serverData.deltaText = '';
					serverData.deltaOffset = editorContext.getCaretOffset();
					serverData.deltaReplaceLength = 0;
				} else {
					deferred.resolve(knownServerState);
					this.onComplete();
					return deferred.promise();
				}
			}
			serverData.requiredStateId = knownServerState.stateId;
		}

		knownServerState.updateInProgress = true;
		var self = this;
		self.sendRequest(editorContext, {
			type: 'PUT',
			data: serverData,
			
			success: function(result) {
				if (result.conflict) {
					// The server has lost its session state and the resource is loaded from the server
					if (knownServerState.text !== undefined) {
						delete knownServerState.updateInProgress;
						delete knownServerState.text;
						delete knownServerState.stateId;
						self.invoke(editorContext, params, deferred);
					} else {
						deferred.reject(result.conflict);
					}
					return false;
				}
				var listeners = editorContext.updateServerState(currentText, result.stateId);
				for (var i = 0; i < listeners.length; i++) {
					self.addCompletionCallback(listeners[i], params);
				}
				deferred.resolve(result);
			},
			
			error: function(xhr, textStatus, errorThrown) {
				if (xhr.status == 404 && !params.loadFromServer && knownServerState.text !== undefined) {
					// The server has lost its session state and the resource is not loaded from the server
					delete knownServerState.updateInProgress;
					delete knownServerState.text;
					delete knownServerState.stateId;
					self.invoke(editorContext, params, deferred);
					return true;
				}
				deferred.reject(errorThrown);
			},
			
			complete: self.onComplete.bind(self)
		}, true);
		return deferred.promise().always(function() {
			knownServerState.updateInProgress = false;
		});
	};
	
	return UpdateService;
});
/*******************************************************************************
 * Copyright (c) 2015 itemis AG (http://www.itemis.eu) and others.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *******************************************************************************/

define('xtext/services/ContentAssistService',['xtext/services/XtextService', 'jquery'], function(XtextService, jQuery) {

	/**
	 * Service class for content assist proposals. The proposals are returned as promise of
	 * a Deferred object.
	 */
	function ContentAssistService(serviceUrl, resourceId, updateService) {
		this.initialize(serviceUrl, 'assist', resourceId, updateService);
	}

	ContentAssistService.prototype = new XtextService();
	
	ContentAssistService.prototype.invoke = function(editorContext, params, deferred) {
		if (deferred === undefined) {
			deferred = jQuery.Deferred();
		}
		var serverData = {
			contentType: params.contentType
		};
		if (params.offset)
			serverData.caretOffset = params.offset;
		else
			serverData.caretOffset = editorContext.getCaretOffset();
		var selection = params.selection ? params.selection : editorContext.getSelection();
		if (selection.start != serverData.caretOffset || selection.end != serverData.caretOffset) {
			serverData.selectionStart = selection.start;
			serverData.selectionEnd = selection.end;
		}
		var currentText;
		var httpMethod = 'GET';
		var onComplete = undefined;
		var knownServerState = editorContext.getServerState();
		if (params.sendFullText) {
			serverData.fullText = editorContext.getText();
			httpMethod = 'POST';
		} else {
			serverData.requiredStateId = knownServerState.stateId;
			if (this._updateService) {
				if (knownServerState.text === undefined || knownServerState.updateInProgress) {
					var self = this;
					this._updateService.addCompletionCallback(function() {
						self.invoke(editorContext, params, deferred);
					});
					return deferred.promise();
				}
				knownServerState.updateInProgress = true;
				onComplete = this._updateService.onComplete.bind(this._updateService);
				currentText = editorContext.getText();
				this._updateService.computeDelta(knownServerState.text, currentText, serverData);
				if (serverData.deltaText !== undefined) {
					httpMethod = 'POST';
				}
			}
		}
		
		var self = this;
		self.sendRequest(editorContext, {
			type: httpMethod,
			data: serverData,
			
			success: function(result) {
				if (result.conflict) {
					// The server has lost its session state and the resource is loaded from the server
					if (self._increaseRecursionCount(editorContext)) {
						if (onComplete) {
							delete knownServerState.updateInProgress;
							delete knownServerState.text;
							delete knownServerState.stateId;
							self._updateService.addCompletionCallback(function() {
								self.invoke(editorContext, params, deferred);
							});
							self._updateService.invoke(editorContext, params);
						} else {
							var paramsCopy = {};
							for (var p in params) {
								if (params.hasOwnProperty(p))
									paramsCopy[p] = params[p];
							}
							paramsCopy.sendFullText = true;
							self.invoke(editorContext, paramsCopy, deferred);
						}
					} else {
						deferred.reject(result.conflict);
					}
					return false;
				}
				if (onComplete && result.stateId !== undefined && result.stateId != editorContext.getServerState().stateId) {
					var listeners = editorContext.updateServerState(currentText, result.stateId);
					for (var i = 0; i < listeners.length; i++) {
						self._updateService.addCompletionCallback(listeners[i], params);
					}
				}
				deferred.resolve(result.entries);
			},
			
			error: function(xhr, textStatus, errorThrown) {
				if (onComplete && xhr.status == 404 && !params.loadFromServer && knownServerState.text !== undefined) {
					// The server has lost its session state and the resource is not loaded from the server
					delete knownServerState.updateInProgress;
					delete knownServerState.text;
					delete knownServerState.stateId;
					self._updateService.addCompletionCallback(function() {
						self.invoke(editorContext, params, deferred);
					});
					self._updateService.invoke(editorContext, params);
					return true;
				}
				deferred.reject(errorThrown);
			},
			
			complete: onComplete
		}, !params.sendFullText);
		var result = deferred.promise();
		if (onComplete) {
			result.always(function() {
				knownServerState.updateInProgress = false;
			});
		}
		return result;
	};

	return ContentAssistService;
});

/*******************************************************************************
 * Copyright (c) 2015 itemis AG (http://www.itemis.eu) and others.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *******************************************************************************/

define('xtext/services/HoverService',['xtext/services/XtextService', 'jquery'], function(XtextService, jQuery) {
	
	/**
	 * Service class for hover information.
	 */
	function HoverService(serviceUrl, resourceId, updateService) {
		this.initialize(serviceUrl, 'hover', resourceId, updateService);
	};

	HoverService.prototype = new XtextService();

	HoverService.prototype._initServerData = function(serverData, editorContext, params) {
		// In order to display hover info for a selected completion proposal while the content
		// assist popup is shown, the selected proposal is passed as parameter
		if (params.proposal && params.proposal.proposal)
			serverData.proposal = params.proposal.proposal;
		if (params.offset)
			serverData.caretOffset = params.offset;
		else
			serverData.caretOffset = editorContext.getCaretOffset();
		var selection = params.selection ? params.selection : editorContext.getSelection();
		if (selection.start != serverData.caretOffset || selection.end != serverData.caretOffset) {
			serverData.selectionStart = selection.start;
			serverData.selectionEnd = selection.end;
		}
	};
	
	HoverService.prototype._getSuccessCallback = function(editorContext, params, deferred) {
		var delay = params.mouseHoverDelay;
		if (!delay)
			delay = 500;
		var showTime = new Date().getTime() + delay;
		return function(result) {
			if (result.conflict || !result.title && !result.content) {
				deferred.reject();
			} else {
				var remainingTimeout = Math.max(0, showTime - new Date().getTime());
				setTimeout(function() {
					if (!params.sendFullText && result.stateId !== undefined
							&& result.stateId != editorContext.getServerState().stateId) 
						deferred.reject();
					else
						deferred.resolve(result);
				}, remainingTimeout);
			}
		};
	};
	
	return HoverService;
});
/*******************************************************************************
 * Copyright (c) 2015 itemis AG (http://www.itemis.eu) and others.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *******************************************************************************/

define('xtext/services/OccurrencesService',['xtext/services/XtextService', 'jquery'], function(XtextService, jQuery) {
	
	/**
	 * Service class for marking occurrences.
	 */
	function OccurrencesService(serviceUrl, resourceId, updateService) {
		this.initialize(serviceUrl, 'occurrences', resourceId, updateService);
	};

	OccurrencesService.prototype = new XtextService();

	OccurrencesService.prototype._initServerData = function(serverData, editorContext, params) {
		if (params.offset)
			serverData.caretOffset = params.offset;
		else
			serverData.caretOffset = editorContext.getCaretOffset();
	};
	
	OccurrencesService.prototype._getSuccessCallback = function(editorContext, params, deferred) {
		return function(result) {
			if (result.conflict || !params.sendFullText && result.stateId !== undefined
					&& result.stateId != editorContext.getServerState().stateId) 
				deferred.reject();
			else 
				deferred.resolve(result);
		}
	}

	return OccurrencesService;
});
/*******************************************************************************
 * Copyright (c) 2015 itemis AG (http://www.itemis.eu) and others.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *******************************************************************************/

define('xtext/services/FormattingService',['xtext/services/XtextService', 'jquery'], function(XtextService, jQuery) {
	
	/**
	 * Service class for formatting text.
	 */
	function FormattingService(serviceUrl, resourceId, updateService) {
		this.initialize(serviceUrl, 'format', resourceId, updateService);
	};

	FormattingService.prototype = new XtextService();

	FormattingService.prototype._initServerData = function(serverData, editorContext, params) {
		var selection = params.selection ? params.selection : editorContext.getSelection();
		if (selection.end > selection.start) {
			serverData.selectionStart = selection.start;
			serverData.selectionEnd = selection.end;
		}
		return {
			httpMethod: 'POST'
		};
	};
	
	FormattingService.prototype._processResult = function(result, editorContext) {
		// The text update may be asynchronous, so we have to compute the new text ourselves
		var newText;
		if (result.replaceRegion) {
			var fullText = editorContext.getText();
			var start = result.replaceRegion.offset;
			var end = result.replaceRegion.offset + result.replaceRegion.length;
			editorContext.setText(result.formattedText, start, end);
			newText = fullText.substring(0, start) + result.formattedText + fullText.substring(end);
		} else {
			editorContext.setText(result.formattedText);
			newText = result.formattedText;
		}
		var listeners = editorContext.updateServerState(newText, result.stateId);
		for (var i = 0; i < listeners.length; i++) {
			listeners[i]({});
		}
	};
	
	return FormattingService;
});
/*******************************************************************************
 * Copyright (c) 2015 itemis AG (http://www.itemis.eu) and others.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 ******************************************************************************/

define('xtext/ServiceBuilder',[
    'jquery',
    'xtext/services/XtextService',
	'xtext/services/LoadResourceService',
	'xtext/services/SaveResourceService',
	'xtext/services/HighlightingService',
	'xtext/services/ValidationService',
	'xtext/services/UpdateService',
	'xtext/services/ContentAssistService',
	'xtext/services/HoverService',
	'xtext/services/OccurrencesService',
	'xtext/services/FormattingService'
], function(jQuery, XtextService, LoadResourceService, SaveResourceService, HighlightingService,
		ValidationService, UpdateService, ContentAssistService, HoverService, OccurrencesService,
		FormattingService) {
	
	/**
	 * Builder class for the Xtext services.
	 */
	function ServiceBuilder(xtextServices) {
		this.services = xtextServices;
	};

	/**
	 * Create all the available Xtext services depending on the configuration.
	 */
	ServiceBuilder.prototype.createServices = function() {
		var services = this.services;
		var options = services.options;
		var editorContext = services.editorContext;
		editorContext.xtextServices = services;
		var self = this;
		if (!options.serviceUrl) {
			if (!options.baseUrl)
				options.baseUrl = '/';
			else if (options.baseUrl.charAt(0) != '/')
				options.baseUrl = '/' + options.baseUrl;
			options.serviceUrl = window.location.protocol + '//' + window.location.host + options.baseUrl + 'xtext-service';
		}
		if (options.resourceId) {
			if (!options.xtextLang)
				options.xtextLang = options.resourceId.split(/[?#]/)[0].split('.').pop();
			if (options.loadFromServer === undefined)
				options.loadFromServer = true;
			if (options.loadFromServer && this.setupPersistenceServices) {
				services.loadResourceService = new LoadResourceService(options.serviceUrl, options.resourceId, false);
				services.loadResource = function(addParams) {
					return services.loadResourceService.invoke(editorContext, ServiceBuilder.mergeOptions(addParams, options));
				}
				services.saveResourceService = new SaveResourceService(options.serviceUrl, options.resourceId);
				services.saveResource = function(addParams) {
					return services.saveResourceService.invoke(editorContext, ServiceBuilder.mergeOptions(addParams, options));
				}
				services.revertResourceService = new LoadResourceService(options.serviceUrl, options.resourceId, true);
				services.revertResource = function(addParams) {
					return services.revertResourceService.invoke(editorContext, ServiceBuilder.mergeOptions(addParams, options));
				}
				this.setupPersistenceServices();
				services.loadResource();
			}
		} else {
			if (options.loadFromServer === undefined)
				options.loadFromServer = false;
			if (options.xtextLang) {
				var randomId = Math.floor(Math.random() * 2147483648).toString(16);
				options.resourceId = randomId + '.' + options.xtextLang;
			}
		}
		
		if (this.setupSyntaxHighlighting) {
			this.setupSyntaxHighlighting();
		}
		if (options.enableHighlightingService || options.enableHighlightingService === undefined) {
			services.highlightingService = new HighlightingService(options.serviceUrl, options.resourceId);
			services.computeHighlighting = function(addParams) {
				return services.highlightingService.invoke(editorContext, ServiceBuilder.mergeOptions(addParams, options));
			}
		}
		if (options.enableValidationService || options.enableValidationService === undefined) {
			services.validationService = new ValidationService(options.serviceUrl, options.resourceId);
			services.validate = function(addParams) {
				return services.validationService.invoke(editorContext, ServiceBuilder.mergeOptions(addParams, options));
			}
		}
		if (this.setupUpdateService) {
			function refreshDocument() {
				if (services.highlightingService && self.doHighlighting) {
					services.highlightingService.setState(undefined);
					self.doHighlighting();
				}
				if (services.validationService && self.doValidation) {
					services.validationService.setState(undefined);
					self.doValidation();
				}
			}
			if (!options.sendFullText) {
				services.updateService = new UpdateService(options.serviceUrl, options.resourceId);
				services.update = function(addParams) {
					return services.updateService.invoke(editorContext, ServiceBuilder.mergeOptions(addParams, options));
				}
				if (services.saveResourceService)
					services.saveResourceService._updateService = services.updateService;
				editorContext.addServerStateListener(refreshDocument);
			}
			this.setupUpdateService(refreshDocument);
		}
		if ((options.enableContentAssistService || options.enableContentAssistService === undefined)
				&& this.setupContentAssistService) {
			services.contentAssistService = new ContentAssistService(options.serviceUrl, options.resourceId, services.updateService);
			services.getContentAssist = function(addParams) {
				return services.contentAssistService.invoke(editorContext, ServiceBuilder.mergeOptions(addParams, options));
			}
			this.setupContentAssistService();
		}
		if ((options.enableHoverService || options.enableHoverService === undefined)
				&& this.setupHoverService) {
			services.hoverService = new HoverService(options.serviceUrl, options.resourceId, services.updateService);
			services.getHoverInfo = function(addParams) {
				return services.hoverService.invoke(editorContext, ServiceBuilder.mergeOptions(addParams, options));
			}
			this.setupHoverService();
		}
		if ((options.enableOccurrencesService || options.enableOccurrencesService === undefined)
				&& this.setupOccurrencesService) {
			services.occurrencesService = new OccurrencesService(options.serviceUrl, options.resourceId, services.updateService);
			services.getOccurrences = function(addParams) {
				return services.occurrencesService.invoke(editorContext, ServiceBuilder.mergeOptions(addParams, options));
			}
			this.setupOccurrencesService();
		}
		if ((options.enableFormattingService || options.enableFormattingService === undefined)
				&& this.setupFormattingService) {
			services.formattingService = new FormattingService(options.serviceUrl, options.resourceId, services.updateService);
			services.format = function(addParams) {
				return services.formattingService.invoke(editorContext, ServiceBuilder.mergeOptions(addParams, options));
			}
			this.setupFormattingService();
		}
		if (options.enableGeneratorService || options.enableGeneratorService === undefined) {
			services.generatorService = new XtextService();
			services.generatorService.initialize(services, 'generate');
			services.generatorService._initServerData = function(serverData, editorContext, params) {
				if (params.allArtifacts)
					serverData.allArtifacts = params.allArtifacts;
				else if (params.artifactId)
					serverData.artifact = params.artifactId;
				if (params.includeContent !== undefined)
					serverData.includeContent = params.includeContent;
			}
			services.generate = function(addParams) {
				return services.generatorService.invoke(editorContext, ServiceBuilder.mergeOptions(addParams, options));
			}
		}
		
		if (options.dirtyElement) {
			var doc = options.document || document;
			var dirtyElement;
			if (typeof(options.dirtyElement) === 'string')
				dirtyElement = jQuery('#' + options.dirtyElement, doc);
			else
				dirtyElement = jQuery(options.dirtyElement);
			var dirtyStatusClass = options.dirtyStatusClass;
			if (!dirtyStatusClass)
				dirtyStatusClass = 'dirty';
			editorContext.addDirtyStateListener(function(dirty) {
				if (dirty)
					dirtyElement.addClass(dirtyStatusClass);
				else
					dirtyElement.removeClass(dirtyStatusClass);
			});
		}
		
		services.successListeners = [];
		services.errorListeners = [function(serviceType, severity, message, requestData) {
			if (options.showErrorDialogs)
				window.alert('Xtext service \'' + serviceType + '\' failed: ' + message);
			else
				console.log('Xtext service \'' + serviceType + '\' failed: ' + message);
		}];
	}
	
	/**
	 * Change the resource associated with this service builder.
	 */
	ServiceBuilder.prototype.changeResource = function(resourceId) {
		var services = this.services;
		var options = services.options;
		options.resourceId = resourceId;
		for (var p in services) {
			if (services.hasOwnProperty(p)) {
				var service = services[p];
				if (service._serviceType && jQuery.isFunction(service.initialize))
					services[p].initialize(options.serviceUrl, service._serviceType, resourceId, services.updateService);
			}
		}
		var knownServerState = services.editorContext.getServerState();
		delete knownServerState.stateId;
		delete knownServerState.text;
		if (options.loadFromServer && jQuery.isFunction(services.loadResource)) {
			services.loadResource();
		}
	}
	
	/**
	 * Create a copy of the given object.
	 */
	ServiceBuilder.copy = function(obj) {
		var copy = {};
		for (var p in obj) {
			if (obj.hasOwnProperty(p))
				copy[p] = obj[p];
		}
		return copy;
	}
	
	/**
	 * Translate an HTML attribute name to a JS option name.
	 */
	ServiceBuilder.optionName = function(name) {
		var prefix = 'data-editor-';
		if (name.substring(0, prefix.length) === prefix) {
			var key = name.substring(prefix.length);
			key = key.replace(/-([a-z])/ig, function(all, character) {
				return character.toUpperCase();
			});
			return key;
		}
		return undefined;
	}
	
	/**
	 * Copy all default options into the given set of additional options.
	 */
	ServiceBuilder.mergeOptions = function(options, defaultOptions) {
		if (options) {
			for (var p in defaultOptions) {
				if (defaultOptions.hasOwnProperty(p))
					options[p] = defaultOptions[p];
			}
			return options;
		} else {
			return ServiceBuilder.copy(defaultOptions);
		}
	}
	
	/**
	 * Merge all properties of the given parent element with the given default options.
	 */
	ServiceBuilder.mergeParentOptions = function(parent, defaultOptions) {
		var options = ServiceBuilder.copy(defaultOptions);
		for (var attr, j = 0, attrs = parent.attributes, l = attrs.length; j < l; j++) {
			attr = attrs.item(j);
			var key = ServiceBuilder.optionName(attr.nodeName);
			if (key) {
				var value = attr.nodeValue;
				if (value === 'true' || value === 'false')
					value = value === 'true';
				options[key] = value;
			}
		}
		return options;
	}
	
	return ServiceBuilder;
});
/*******************************************************************************
 * Copyright (c) 2015 itemis AG (http://www.itemis.eu) and others.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 ******************************************************************************/

define('xtext/OrionEditorContext',[],function() {
	
	/**
	 * An editor context mediates between the Xtext services and the Orion
	 * editor framework.
	 */
	function OrionEditorContext(editorViewer, contentType) {
		this._editorViewer = editorViewer;
		this._editor = editorViewer.editor;
		this._contentType = contentType;
		this._serverState = {};
		this._serverStateListeners = [];
		this._dirty = false;
		this._dirtyStateListeners = [];
	};

	OrionEditorContext.prototype = {
		
		getServerState: function() {
			return this._serverState;
		},
		
		updateServerState: function(currentText, currentStateId) {
			this._serverState.text = currentText;
			this._serverState.stateId = currentStateId;
			return this._serverStateListeners;
		},
		
		addServerStateListener: function(listener) {
			this._serverStateListeners.push(listener);
		},
		
		getCaretOffset: function() {
			return this._editor.getTextView().getCaretOffset();
		},
		
		getLineStart: function(lineNumber) {
			var view = this._editor.getTextView();
			return view.getLineStart(view.getLineAtOffset(view.getCaretOffset()));
		},
		
		getSelection: function() {
			return this._editor.getTextView().getSelection();
		},
		
		getText: function(start, end) {
			return this._editor.getText(start, end);
		},
		
		isDirty: function() {
			return this._dirty;
		},
		
		setDirty: function(dirty) {
			if (dirty != this._dirty) {
				for (var i = 0; i < this._dirtyStateListeners.length; i++) {
					this._dirtyStateListeners[i](dirty);
				}
			}
			this._dirty = dirty;
		},
		
		addDirtyStateListener: function(listener) {
			this._dirtyStateListeners.push(listener);
		},
		
		clearUndoStack: function() {
			this._editor.getUndoStack().reset();
		},
		
		setCaretOffset: function(offset, show) {
			this._editor.getTextView().setCaretOffset(offset, show);
		},
		
		setSelection: function(selection) {
			this._editor.getTextView().setSelection(selection.start, selection.end);
		},
		
		setText: function(text, start, end) {
			if (start === undefined || end === undefined) {
				this._editorViewer.setContents(text, this._contentType);
			} else {
				var fullText = this._editor.getText();
				var newText = fullText.substring(0, start) + text + fullText.substring(end);
				this._editorViewer.setContents(newText, this._contentType);
			}
		}
		
	};
	
	return OrionEditorContext;
});
/*******************************************************************************
 * Copyright (c) 2015, 2016 itemis AG (http://www.itemis.eu) and others.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *******************************************************************************/

/*
 * Use `createEditor(options)` to create an Xtext editor. You can specify options either
 * through the function parameter or through `data-editor-x` attributes, where x is an
 * option name with camelCase converted to hyphen-separated.
 * The following options are available:
 *
 * baseUrl = "/" {String}
 *     The path segment where the Xtext service is found; see serviceUrl option.
 * contentAssistCharTriggers {String}
 *     Characters that invoke the content assist service when typed (see Orion documentation).
 * contentAssistExcludedStyles {String}
 *     Excluded styles for character triggers (see Orion documentation).
 * contentType {String}
 *     The content type included in requests to the Xtext server.
 * dirtyElement {String | DOMElement}
 *     An element into which the dirty status class is written when the editor is marked dirty;
 *     it can be either a DOM element or an ID for a DOM element.
 * dirtyStatusClass = 'dirty' {String}
 *     A CSS class name written into the dirtyElement when the editor is marked dirty.
 * document {Document}
 *     The document; if not specified, the global document is used.
 * enableContentAssistService = true {Boolean}
 *     Whether content assist should be enabled.
 * enableFormattingAction = false {Boolean}
 *     Whether the formatting action should be bound to the standard keystroke ctrl+shift+f / cmd+shift+f.
 * enableFormattingService = true {Boolean}
 *     Whether text formatting should be enabled.
 * enableGeneratorService = true {Boolean}
 *     Whether code generation should be enabled (must be triggered through JavaScript code).
 * enableHoverService = true {Boolean}
 *     Whether mouse hover information should be enabled.
 * enableHighlightingService = true {Boolean}
 *     Whether semantic highlighting (computed on the server) should be enabled.
 * enableOccurrencesService = true {Boolean}
 *     Whether marking occurrences should be enabled.
 * enableSaveAction = false {Boolean}
 *     Whether the save action should be bound to the standard keystroke ctrl+s / cmd+s.
 * enableValidationService = true {Boolean}
 *     Whether validation should be enabled.
 * loadFromServer = true {Boolean}
 *     Whether to load the editor content from the server.
 * mouseHoverDelay = 500 {Number}
 *     The number of milliseconds to wait after a mouse hover before the information tooltip is displayed.
 * parent = 'xtext-editor' {String | DOMElement}
 *     The parent element for the view; it can be either a DOM element or an ID for a DOM element.
 * parentClass = 'xtext-editor' {String}
 *     If the 'parent' option is not given, this option is used to find elements that match the given class name.
 * randomContentType = true {Boolean}
 *     Whether to generate a random content type to avoid clashes between multiple editor instances.
 * resourceId {String}
 *     The identifier of the resource displayed in the text editor; this option is sent to the server to
 *     communicate required information on the respective resource.
 * selectionUpdateDelay = 550 {Number}
 *     The number of milliseconds to wait after a selection change before Xtext services are invoked.
 * sendFullText = false {Boolean}
 *     Whether the full text shall be sent to the server with each request; use this if you want
 *     the server to run in stateless mode. If the option is inactive, the server state is updated regularly.
 * serviceUrl {String}
 *     The URL of the Xtext servlet; if no value is given, it is constructed using the baseUrl option in the form
 *     {location.protocol}//{location.host}{baseUrl}xtext-service
 * showErrorDialogs = false {Boolean}
 *     Whether errors should be displayed in popup dialogs.
 * syntaxDefinition {String}
 *     A path to a JS file defining an Orion syntax definition; if no path is given, it is built from
 *     the 'xtextLang' option in the form 'xtext-resources/{xtextLang}-syntax'. Set this option to 'none' to
 *     disable syntax highlighting.
 * textUpdateDelay = 500 {Number}
 *     The number of milliseconds to wait after a text change before Xtext services are invoked.
 * xtextLang {String}
 *     The language name (usually the file extension configured for the language).
 */
define('xtext/xtext-orion',[
	'jquery',
	'orion/Deferred',
	'orion/keyBinding',
	'orion/editor/annotations',
	'embeddedEditor/builder/embeddedEditor',
	'xtext/compatibility',
	'xtext/ServiceBuilder',
	'xtext/OrionEditorContext'
], function(jQuery, OrionDeferred, mKeyBinding, mAnnotations, mEmbeddedEditor, compatibility,
		ServiceBuilder, EditorContext) {
	
	var exports = {};
	
	/**
	 * Create one or more Xtext editor instances configured with the given options.
	 * The return value is a Deferred object that eventually resolves to either an Orion
	 * editor viewer or an array of Orion editor viewers.
	 */
	exports.createEditor = function(options) {
		if (!options)
			options = {};
		
		var query;
		if (jQuery.type(options.parent) === 'string') {
			query = jQuery('#' + options.parent, options.document);
		} else if (options.parent) {
			query = jQuery(options.parent);
		} else if (jQuery.type(options.parentClass) === 'string') {
			query = jQuery('.' + options.parentClass, options.document);
		} else {
			query = jQuery('#xtext-editor', options.document);
			if (query.length == 0)
				query = jQuery('.xtext-editor', options.document);
		}
		
		var startupOptions = options.startupOptions;
		if (!startupOptions)
			startupOptions = { defaultPlugins: ['webToolsPlugin.html'] };
		var embeddedEditor = new mEmbeddedEditor(startupOptions);
		var editorData = [];
		query.each(function(index, parent) {
			var editorOptions = ServiceBuilder.mergeParentOptions(parent, options);
			var contentType = exports.registerContentType(embeddedEditor, editorOptions);
			editorData.push({
				parent: parent,
				options: editorOptions,
				contentType: contentType
			});
		});
		
		var deferred = jQuery.Deferred();
		var editorViewers = [];
		var finishedViewers = 0;
		editorData.forEach(function(data, index) {
			var contentType = data.contentType;
			var content = jQuery(data.parent).text();
			var createResult = embeddedEditor.create({parent: data.parent, contentType: contentType});
			
			function onEditorCreated(editorViewer) {
				var xtextServices = exports.createServices(editorViewer, data.options, contentType);
				if (!xtextServices.options.loadFromServer)
					editorViewer.setContents(content, contentType);
				editorViewers[index] = editorViewer;
				finishedViewers++;
				if (finishedViewers == query.length) {
					if (finishedViewers == 1)
						deferred.resolve(editorViewer);
					else
						deferred.resolve(editorViewers);
				}
			}
			function onEditorFailed(error) {
				deferred.reject(error);
			}
			
			var syntaxDefinition = data.options.syntaxDefinition;
			if (syntaxDefinition != 'none' && (jQuery.type(syntaxDefinition) === 'string' || !syntaxDefinition && data.options.xtextLang)) {
				if (!syntaxDefinition)
					syntaxDefinition = 'xtext-resources/' + data.options.xtextLang + '-syntax';
				require([syntaxDefinition], function(grammar) {
					data.options.syntaxDefinition = grammar;
					createResult.then(onEditorCreated, onEditorFailed);
				});
			} else {
				createResult.then(onEditorCreated, onEditorFailed);
			}
		});
		if (query.length == 0)
			deferred.reject();
		return deferred.promise();
	}
	
	function OrionServiceBuilder(editorViewer, xtextServices) {
		this.viewer = editorViewer;
		ServiceBuilder.call(this, xtextServices);
	}
	OrionServiceBuilder.prototype = new ServiceBuilder();
	
	/**
	 * Register the content type derived from the given editor options. This has to be done
	 * before the editor is created.
	 */
	exports.registerContentType = function(embeddedEditor, options) {
		var extension = options.xtextLang;
		if (!extension && options.resourceId)
			extension = options.resourceId.split(/[?#]/)[0].split('.').pop();
		var contentType = options.contentType;
		if (!contentType && options.xtextLang)
			contentType = 'xtext/' + options.xtextLang;
		else if (!contentType)
			contentType = 'xtext';
		if (options.randomContentType === undefined || options.randomContentType)
			contentType = contentType + '_' + Math.floor(Math.random() * 2147483648).toString(16);
		embeddedEditor.serviceRegistry.registerService('orion.core.contenttype', {}, {
			contentTypes: [{
				id: contentType,
				extension: [extension],
				name: 'Xtext Language',
				'extends': 'text/plain'
			}]
		});
		return contentType;
	}
	
	/**
	 * Configure Xtext services for the given editor. The editor does not have to be created
	 * with createEditor(options).
	 */
	exports.createServices = function(editorViewer, options, contentType) {
		if (!contentType && options.contentType)
			contentType = options.contentType;
		var xtextServices = {
			options: options,
			editorContext: new EditorContext(editorViewer, contentType),
			contentType: contentType,
			_highlightAnnotationTypes: []
		};
		var serviceBuilder = new OrionServiceBuilder(editorViewer, xtextServices);
		serviceBuilder.createServices();
		xtextServices.serviceBuilder = serviceBuilder;
		editorViewer.xtextServices = xtextServices;
		return xtextServices;
	}
	
	/**
	 * Remove all services and listeners that have been previously created with createServices(editor, options).
	 */
	exports.removeServices = function(editorViewer) {
		if (!editorViewer.xtextServices)
			return;
		var services = editorViewer.xtextServices;
		if (services.highlighterRegistration)
			services.highlighterRegistration.unregister();
		if (services.modelRegistration)
			services.modelRegistration.unregister();
		if (services.contentAssistRegistration)
			services.contentAssistRegistration.unregister();
		if (services.hoverRegistration)
			services.hoverRegistration.unregister();
		if (services.occurrencesRegistration)
			services.occurrencesRegistration.unregister();
		if (services.formatCommandRegistration)
			services.formatCommandRegistration.unregister();
		if (services.saveEventListener)
			editorViewer.editor.removeEventListener('InputChanged', services.saveEventListener);
		editorViewer.editor.showAnnotations([], services._highlightAnnotationTypes);
		editorViewer.editor.showProblems([]);
		delete editorViewer.xtextServices;
	}
	
	/**
	 * Syntax highlighting (without semantic highlighting).
	 */
	OrionServiceBuilder.prototype.setupSyntaxHighlighting = function() {
		var services = this.services;
		var syntaxDefinition = services.options.syntaxDefinition;
		if (jQuery.type(syntaxDefinition) !== 'string') {
			var contentType = services.contentType;
			if (!syntaxDefinition.contentTypes)
				syntaxDefinition.contentTypes = [contentType];
			else if (jQuery.inArray(contentType, syntaxDefinition.contentTypes) < 0)
				syntaxDefinition.contentTypes.push(contentType);
			services.highlighterRegistration = this.viewer.serviceRegistry.registerService(
					'orion.edit.highlighter', {}, syntaxDefinition);
		}
	}
	
	/**
	 * Document update service.
	 */
	OrionServiceBuilder.prototype.setupUpdateService = function(refreshDocument) {
		var services = this.services;
		var editorContext = services.editorContext;
		var textUpdateDelay = services.options.textUpdateDelay;
		if (!textUpdateDelay)
			textUpdateDelay = 500;
		function modelChangeListener(event) {
			// The first event is triggered by editorViewer.setContents(..)
			if (editorContext._xtext_init)
				editorContext._xtext_init = false;
			else
				editorContext.setDirty(true);
			if (editorContext._modelChangeTimeout)
				clearTimeout(editorContext._modelChangeTimeout);
			editorContext._modelChangeTimeout = setTimeout(function() {
				if (services.options.sendFullText)
					refreshDocument();
				else
					services.update();
			}, textUpdateDelay);
		}
		editorContext._xtext_init = true;
		services.modelRegistration = this.viewer.serviceRegistry.registerService('orion.edit.model',
				{onModelChanged: modelChangeListener}, {contentType: [services.contentType]});
	}
	
	/**
	 * Persistence services: load, save, and revert.
	 */
	OrionServiceBuilder.prototype.setupPersistenceServices = function() {
		var services = this.services;
		var editorViewer = this.viewer;
		if (services.options.enableSaveAction) {
			editorViewer.inputManager.setAutoSaveTimeout(-1);
			services.saveEventListener = function(event) {
				if (event.contentsSaved) {
					services.saveResource();
				}
		    }
			editorViewer.editor.addEventListener('InputChanged', services.saveEventListener);
		}
	}
	
	/**
	 * Content assist service.
	 */
	OrionServiceBuilder.prototype.setupContentAssistService = function() {
		var services = this.services;
		var options = services.options;
		function computeContentAssist(orionContext, params) {
			ServiceBuilder.mergeOptions(params, options);
			var deferred = new OrionDeferred();
			services.contentAssistService.invoke(services.editorContext, params).done(function(entries) {
				deferred.resolve(entries.map(function(entry) {
					return {
						proposal: entry.proposal,
						prefix: entry.prefix,
						overwrite: true,
						name: (entry.label ? entry.label: entry.proposal),
						description: entry.description,
						additionalEdits: entry.textReplacements,
						positions: entry.editPositions,
						escapePosition: entry.escapePosition
					};
				}));
			}).fail(function() {
				deferred.reject();
			});
			return deferred.promise;
		}
		var editorViewer = this.viewer;
		var serviceInfo = {
			name: 'Xtext content assist service',
			contentType: [services.contentType]
		};
		if (options.contentAssistCharTriggers) {
			serviceInfo.charTriggers = options.contentAssistCharTriggers;
			serviceInfo.excludedStyles = options.contentAssistExcludedStyles;
			if (editorViewer.settings)
				editorViewer.settings.contentAssistAutoTrigger = true;
		}
		services.contentAssistRegistration = editorViewer.serviceRegistry.registerService('orion.edit.contentAssist',
				{computeContentAssist: computeContentAssist}, serviceInfo);
	}
	
	/**
	 * On-demand registers and returns the annotation type with the given name.
	 */
	OrionServiceBuilder.prototype._getHighlightAnnotationType = function(typeName) {
		var type = mAnnotations.AnnotationType.getType(typeName);
		if (type)
			return typeName;
		var properties = {
			title: typeName,
			style: {styleClass: "annotation " + typeName},
			html: "<div class='annotationHTML " + typeName + "'></div>", 
			overviewStyle: {styleClass: "annotationOverview " + typeName}
		};
		properties.rangeStyle = {styleClass: "annotationRange " + typeName};
		var newType = mAnnotations.AnnotationType.registerType(typeName, properties);
		this.services._highlightAnnotationTypes.push(newType);
		this.viewer.editor.getAnnotationStyler().addAnnotationType(newType);
		return newType;
	}
		
	/**
	 * Semantic highlighting service.
	 */
	OrionServiceBuilder.prototype.doHighlighting = function() {
		var editorViewer = this.viewer;
		var services = this.services;
		var self = this;
		services.computeHighlighting().done(function(result) {
			var annotations = [];
			for (var i = 0; i < result.regions.length; ++i) {
				var region = result.regions[i];
				region.styleClasses.forEach(function(styleClass) {
					annotations.push({
						description: '',
						start: region.offset,
						end: region.offset + region.length,
						styleClass: styleClass
					});
				});
			}
			editorViewer.editor.showAnnotations(annotations, services._highlightAnnotationTypes, null, function(annotation) {
				return self._getHighlightAnnotationType(annotation.styleClass, editorViewer, services);
			});
		});
	}
			
	/**
	 * Validation service.
	 */
	OrionServiceBuilder.prototype.doValidation = function() {
		var editorViewer = this.viewer;
		var services = this.services;
		services.validate().done(function(result) {
			editorViewer.editor.getEditorContext().showMarkers(result.issues.map(function(entry) {
				return {
					description: entry.description,
					start: entry.offset,
					end: entry.offset + entry.length,
					severity: entry.severity
				};
			}));
		});
	}
	
	/**
	 * Hover service.
	 */
	OrionServiceBuilder.prototype.setupHoverService = function() {
		var services = this.services;
		var options = services.options;
		function computeHoverInfo(orionContext, params) {
			var deferred = new OrionDeferred();
			ServiceBuilder.mergeOptions(params, options);
			services.hoverService.invoke(services.editorContext, params).done(function(entry) {
				deferred.resolve({
					content: entry.title + entry.content,
					type: 'html'
				});
			}).fail(function() {
				deferred.resolve(null);
			});
			return deferred.promise;
		}
		services.hoverRegistration = this.viewer.serviceRegistry.registerService('orion.edit.hover',
				{computeHoverInfo: computeHoverInfo},
				{name: 'Xtext hover service', contentType: [services.contentType]});
	}
	
	/**
	 * Occurrences service.
	 */
	OrionServiceBuilder.prototype.setupOccurrencesService = function() {
		var services = this.services;
		var options = services.options;
		function computeOccurrences(orionContext, params) {
			var deferred = new OrionDeferred();
			ServiceBuilder.mergeOptions(params, options);
			services.occurrencesService.invoke(services.editorContext, params).done(function(occurrencesResult) {
				var readAnnotations = occurrencesResult.readRegions.map(function(region) {
					return {
						start: region.offset,
						end: region.offset + region.length,
						readAccess: true
					};
				});
				var writeAnnotations = occurrencesResult.writeRegions.map(function(region) {
					return {
						start: region.offset,
						end: region.offset + region.length,
						readAccess: false
					};
				});
				deferred.resolve(readAnnotations.concat(writeAnnotations));
			}).fail(function() {
				deferred.resolve({});
			});
			return deferred.promise;
		}
		var editorViewer = this.viewer;
		if (editorViewer.settings)
			editorViewer.settings.showOccurrences = true;
		services.occurrencesRegistration = editorViewer.serviceRegistry.registerService('orion.edit.occurrences',
				{computeOccurrences: computeOccurrences}, {contentType: [services.contentType]});
	}
	
	/**
	 * Formatting service.
	 */
	OrionServiceBuilder.prototype.setupFormattingService = function() {
		var services = this.services;
		var options = services.options;
		if (options.enableFormattingAction) {
			function execute(orionContext, params) {
				var deferred = new OrionDeferred();
				ServiceBuilder.mergeOptions(params, options);
				services.formattingService.invoke(services.editorContext, params).done(function(result) {
					deferred.resolve();
				}).fail(function() {
					deferred.reject();
				});
				return deferred.promise;
			}
			services.formatCommandRegistration = this.viewer.serviceRegistry.registerService('orion.edit.command',
					{execute: execute}, {
				name: 'Xtext formatting service',
				id: 'xtext.formatter',
				key: ['f', true, true],
				contentType: [services.contentType]
			});
		}
	}
	
	return exports;
});


