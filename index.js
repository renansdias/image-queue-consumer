var childProcess = require('child_process');
var path = require('path');
var AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';

var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
var QUEUE_URL = 'https://sqs.us-west-2.amazonaws.com/296250302159/fabrica';

var params = {
	QueueUrl: QUEUE_URL,
	MaxNumberOfMessages: 1,
	MessageAttributeNames: [
		'imageId'
	],
	VisibilityTimeout: 30,
	WaitTimeSeconds: 0
};

setInterval(function() {
	sqs.receiveMessage(params, function(err, data) {
		if (typeof data.Messages != 'undefined') {
			var imageId = data.Messages[0].MessageAttributes["imageId"]["StringValue"];

			console.log("Image ID: " + imageId);
			childProcess.execFile(path.join(__dirname, 'scripts', 'dockerizer'), [imageId], function(err, stdout, stderr) {
				if (err) {
					console.log(err);
				} else {
					console.log(stdout);

					// Delete the message from the queue
					var deleteParams = {
						QueueUrl: QUEUE_URL,
						ReceiptHandle: data.Messages[0].ReceiptHandle
					};

					sqs.deleteMessage(deleteParams, function(err, data) {
						if (err) {
							console.log(err);
						} else {
							console.log(data);
						}
					})
				}
			});
		} else {
			console.log('Message in flight');
		}
	});
}, 10000);