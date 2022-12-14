const tfnode = require('@tensorflow/tfjs-node');
const jimp = require('jimp');
const sharp = require('sharp');
const fs = require('fs')
const {classify} = require('./xray_classifier');


async function prepareImage(imagePath) {
    try {
        await sharp(imagePath).resize({
            width: 128,
            height: 128
        })
        .grayscale()
        .toBuffer()
        .then(function(imageBuffer) {
            return imageBuffer;
        });
    } catch (error) {
        console.error(error);
    }
}

// Based on readImageAsTensor in:
// https://github.com/tensorflow/tfjs-examples/blob/master/electron/image_utils.js
async function readImageAsTensor(filePath, height, width) {}


class InferenceController {
    constructor(classifier) {
        this.classifier = classifier;
    }

    // Based on searchFromFiles in:
    // https://github.com/tensorflow/tfjs-examples/blob/master/electron/image_classifier.js
    runInference = (req, res) => {
        try {
            console.log(req.file);
            if (req.file == undefined) {
                return res.send("You must select an image for inference");
            }
            
            // Read the content of the xray image as tensors with dimensions
            // that match the requirement of the image classifier   
            var [height, width] = this.classifier.getDims();
            sharp(req.file.path)
                .resize(128, 128)
                .grayscale()
                .toColourspace('b-w')
                .toBuffer()
                .then((outputBuffer) => {
                    const imageBuffer = outputBuffer;
                    const imageTensor = tfnode.node.decodeImage(imageBuffer);
                    const imageTensorFloat = tfnode.cast(imageTensor, 'float32');
                    const imageTensorExpand = imageTensorFloat.expandDims(0)
                    const classProbs = this.classifier.classify(imageTensorExpand);
                });

            // Tensorflow.js memory cleanup
            return res.send("NULL") // send back a template view instead
        } catch (error) {
            console.log(error);
            return res.send(`Error when trying to run predict on images: ${error}`);
        }
    }
}

//const xrayClassifier = new XRayClassifier();
//const inferenceController = new InferenceController(xrayClassifier);

const runInference = async (req, res) => {
    try {
        if (req.file == undefined) {
            return res.send("You must select an image for inference");
        }
        let imageTensorExpand = null;
        // Read the content of the xray image as tensors with dimensions
        // that match the requirement of the image classifier   
        await sharp(req.file.path)
            .resize(128, 128)
            .grayscale()
            .toColourspace('b-w')
            .toBuffer()
            .then((outputBuffer) => {
                const imageBuffer = outputBuffer;
                const imageTensor = tfnode.node.decodeImage(imageBuffer);
                const imageTensorFloat = tfnode.cast(imageTensor, 'float32');
                imageTensorExpand = imageTensorFloat.expandDims(0)
            });

        const classProbs = await classify(imageTensorExpand);
        res.send(`Probability of COVID-19: ${classProbs}`);

        // Tensorflow.js memory cleanup
        return res.send("NULL") // send back a template view instead
    } catch (error) {
        console.log(`Error when trying to run predict on images: ${error}`)
    }
}

module.exports = {
    runInference,
};