<?php
// Verificar si se han enviado imágenes
if(isset($_FILES['images'])) {
    // Crear una matriz para almacenar los nombres de archivo de las imágenes enviadas
    $fileNames = array();
    // Obtener el número de imágenes enviadas
    $numFiles = count($_FILES['images']['name']);
    // Recorrer cada imagen enviada
    for($i = 0; $i < $numFiles; $i++) {
        // Obtener el nombre, tipo y ruta temporal de la imagen
        $fileName = $_FILES['images']['name'][$i];
        $fileType = $_FILES['images']['type'][$i];
        $fileTemp = $_FILES['images']['tmp_name'][$i];
        // Verificar que el archivo es una imagen
        if($fileType == 'image/jpeg' || $fileType == 'image/png' || $fileType == 'image/gif') {
        // Obtener las dimensiones de la imagen
        list($width, $height) = getimagesize($fileTemp);
        // Crear una nueva imagen a partir del archivo temporal
        if($fileType == 'image/jpeg') {
            $image = imagecreatefromjpeg($fileTemp);
        } elseif($fileType == 'image/png') {
            $image = imagecreatefrompng($fileTemp);
        } elseif($fileType == 'image/gif') {
            $image = imagecreatefromgif($fileTemp);
        }
        // Calcular el nuevo tamaño de la imagen
        $newWidth = $width * 0.4;
        $newHeight = $height * 0.4;
        // Crear una nueva imagen con las dimensiones reducidas
        $newImage = imagecreatetruecolor($newWidth, $newHeight);
        // Redimensionar la imagen original a la nueva imagen
        imagecopyresampled($newImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        // Crear un nombre de archivo único para la nueva imagen
        if (isset($_POST['names'])) {
            $namesValue = $_POST['names'];
            if ($namesValue == 'keep') {
                $newFileName = $fileName;
            } elseif ($namesValue == 'no-keep') {
                $newFileName = $i+1 . ' - ' . $fileName;
            }
        }
        // Guardar la nueva imagen en el servidor
        imagejpeg($newImage, $newFileName);
        // Agregar el nombre de archivo de la nueva imagen a la matriz de nombres de archivo
        $fileNames[] = $newFileName;
        // Liberar la memoria de las imágenes
        imagedestroy($image);
        imagedestroy($newImage);
        }
    }
    // Crear un archivo zip para descargar las imágenes reducidas
    $zip = new ZipArchive();
    $zipFileName = 'reduced_images.zip';
    if($zip->open($zipFileName, ZipArchive::CREATE) === TRUE) {
        // Agregar cada imagen a la zip
        foreach($fileNames as $fileName) {
            $zip->addFile($fileName);
        }
        $zip->close();
        // Descargar el archivo zip
        header('Content-Type: application/zip');
        header('Content-disposition: attachment; filename=' . $zipFileName);
        header('Content-Length: ' . filesize($zipFileName));
        readfile($zipFileName);
        // Eliminar las imágenes reducidas y el archivo zip del servidor
        foreach($fileNames as $fileName) {
            unlink($fileName);
        }
        unlink($zipFileName);
        exit;
    }
}
