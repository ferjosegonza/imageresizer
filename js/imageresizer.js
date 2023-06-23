let selectedFolderPath = ''; // p/ almacenar la ruta desde donde se seleccionan las imágenes para reducir, p/ luego ofrecer la descarga en la misma carpeta

function validateFile() {
    const fileInput = document.querySelector('input[type=file]');
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const file = fileInput.files[0];
    if (file && !acceptedTypes.includes(file.type)) {
        alert('Invalid file type. Only JPEG, PNG, and GIF images are allowed.');
        fileInput.value = '';
        return false;
    }
    return true;
}

function checkFormValidity() {
    const fileInput = document.querySelector('input[type=file]');
    const radioButtons = document.querySelectorAll('input[type=radio]');
    const submitButton = document.querySelector('button[type=submit]');

    if (fileInput.files.length > 0 && Array.from(radioButtons).some(rb => rb.checked)) {
        submitButton.disabled = false;
    } else {
        submitButton.disabled = true;
    }
}

function resizeImages(event) {
    event.preventDefault();
    const fileInput = document.querySelector('input[type=file]');
    const radioButtons = document.querySelectorAll('input[type=radio]:checked');

    if (fileInput.files.length > 0 && radioButtons.length > 0) {
        const namesValue = radioButtons[0].value;
        const filePromises = [];

        for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            const fileDate = new Date(file.lastModified);
            
            const fileReader = new FileReader();

            filePromises.push(
                new Promise((resolve, reject) => {
                    fileReader.onload = function (event) {
                        const img = new Image();

                        img.onload = function () {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');

                            const newWidth = img.width * 0.4;
                            const newHeight = img.height * 0.4;

                            canvas.width = newWidth;
                            canvas.height = newHeight;

                            ctx.drawImage(img, 0, 0, newWidth, newHeight);

                            const resizedFile = dataURLtoFile(canvas.toDataURL('image/jpeg'), file.name);

                            resolve(resizedFile);
                        };

                        img.src = event.target.result;
                    };

                    fileReader.onerror = function (error) {
                        reject(error);
                    };

                    fileReader.readAsDataURL(file);
                })
            );
        }

        Promise.all(filePromises)
            .then(resizedFiles => {
                const zip = new JSZip();

                for (let i = 0; i < resizedFiles.length; i++) {
                    const file = resizedFiles[i];
                    //const filename = namesValue === 'keep' ? file.name : `${file.name} - ${i + 1}.jpg`;
                    let filename;
                    if (namesValue === 'keep') {
                        filename = file.name;
                    } else if (namesValue === 'index') {
                        filename = `${file.name} - ${i + 1}.jpg`;
                    } else if (namesValue === 'date') {
                        const dateString = fileDate.toISOString().substring(0, 10);
                        filename = `${file.name} - ${dateString}.jpg`;
                    }

                    zip.file(filename, file);
                }

                zip.generateAsync({ type: 'blob' })
                    .then(blob => {
                        // Create a download link for the zip file
                        const downloadLink = document.createElement('a');
                        downloadLink.href = URL.createObjectURL(blob);
                        downloadLink.download = 'reduced_images.zip';

                        // Trigger the download link
                        downloadLink.click();

                        // Open the folder where the images were uploaded from
                        if (selectedFolderPath) {
                            window.open(selectedFolderPath, '_blank');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('An error occurred while generating the ZIP file.');
                    });

                // Reset the form
                fileInput.value = '';
                checkFormValidity();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while resizing images.');
            });
    }
}

function dataURLtoFile(dataURL, filename) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
}

function handleFileInputChange(event) {
    const fileInput = event.target;
    const imageFiles = fileInput.files;
    if (imageFiles.length > 0) {
        const firstImage = imageFiles[0];
        selectedFolderPath = firstImage.webkitRelativePath.substring(0, firstImage.webkitRelativePath.indexOf('/'));
    }
    checkFormValidity();
}

document.addEventListener('DOMContentLoaded', checkFormValidity);
