<?php
/**
 * galleries.php
 *
 * Copyright 2016, 2017, 2020 - TDSystem Thomas Dausner
 */

spl_autoload_register(function($classname) {
	$classname = strtolower(trim(preg_replace('/([A-Z])/', '_$1', $classname), '_'));
	require dirname(__FILE__) . DIRECTORY_SEPARATOR . $classname . '.php';
});

spl_autoload_call('ZipGallery');
spl_autoload_call('ZipGalleryCache');

function getZipGalleryCacheConfig()
{
	return [
		'cacheRoot' => dirname(__FILE__) . DIRECTORY_SEPARATOR . 'zip_cache',
		'cacheEntries' => 10000
	];
}

parse_str($_SERVER['QUERY_STRING'], $query);
$zip = new ZipGallery($query['zip']);
if (isset($query['info']))
{
	header('Content-Type: text/json'); // JSON info
	header('Access-Control-Allow-Origin: *');
	echo $zip->getInfo();
}
elseif (isset($query['file']))
{
	header('Content-Type: image/jpeg'); // JPG picture
	if (isset($query['thumb']))
	{
		$tnw = isset($query['tnw']) ? $query['tnw'] : 50;
		$tnh = isset($query['tnh']) ? $query['tnh'] : 50;
		echo $zip->getThumb($query['file'], $tnw, $tnh);
	}
	else
	{
		echo $zip->getFromZip($query['file']);
	}
}
?>
