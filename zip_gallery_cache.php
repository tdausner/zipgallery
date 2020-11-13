<?php
/**
 * Class ZipGalleryCache
 *
 * implementation of a simple cache.
 *
 * Copyright 2016, 2017, 2020 - TDSystem Thomas Dausner
 *
 * Configuration data for cache:
 *	[
 *		'cacheRoot' => DIRECTORY_SEPARATOR . 'zip_cache',
 *		'cacheEntries' => 10000
 *	];
 *
 * All cache entries are kept in one folder. Cache entry file names are set up in caller.
 *
 * On running into $config['cacheEntries'] number of cache entries the oldest entry is discarded.
 *
 * Each cache entry file names consists of
 * - the full path to the zip file (leading '/' character stripped)
 * - attached the name of the file from the zip archive having all chars '/' replaces by '#'.
 */
class ZipGalleryCache
{
	private $cacheFolder;
	private $maxEntries;
	private $ignorePattern = '';

	public function __construct()
	{
		$config = getZipGalleryCacheConfig();
		$this->cacheFolder = $config['cacheRoot'];
		if (!is_dir($this->cacheFolder))
		{
			mkdir($this->cacheFolder, 0755, true);
		}
		$this->maxEntries = $config['cacheEntries'];
	}

	public function __destruct()
	{
	}

	public function setIgnorePattern($ignorePattern)
	{
		$this->ignorePattern = $ignorePattern;
	}

	/*
	 * get entry from cache.
	 * entry found but older than 'oldest' is unlinked.
	 *
	 * @return null or content
	 */
	public function getEntry($oldest, $cacheName)
	{
		$cacheEntry = $this->cacheFolder . DIRECTORY_SEPARATOR . str_replace('/', '#', $cacheName);
		$data = null;
		$cStat = @stat($cacheEntry);
		if (is_array($cStat))
		{
			// cached file exists
			if ($oldest <= $cStat['mtime'])
			{
				// cached file is newer or same as $oldest
				$data = file_get_contents($cacheEntry);
			}
			else
			{
				// cached file is older than $oldest
				unlink($cacheEntry);
			}
		}
		return $data;
	}

	/*
	 * set entry from cache
	 */
	public function setEntry($cacheName, $data)
	{
		$cacheEntry = $this->cacheFolder . DIRECTORY_SEPARATOR . str_replace('/', '#', $cacheName);
		if (preg_match($this->ignorePattern, $cacheEntry) === 0)
		{
			$dirEntries = scandir($this->cacheFolder);
			$entries = array();
			if ($this->ignorePattern == '')
			{
				$entries = $dirEntries;
			}
			else
			{
				$idx = 0;
				for ($i = 0; $i < count($dirEntries); $i++)
				{
					if (preg_match($this->ignorePattern, $dirEntries[$i]) === 0)
					{
						$entries[$idx++] = $dirEntries[$i];
					}
				}
			}
			if (count($entries) >= $this->maxEntries + 2)
			{
				// must unlink oldest
				// create array having entries mtime => filename
				$times = [];
				// first $entries are '.' and '..'
				for ($i = 2; $i < count($entries); $i++)
				{
					$times[stat($this->cacheFolder . DIRECTORY_SEPARATOR . $entries[$i])['mtime']] = $entries[$i];
				}
				ksort($times);
				// first entry keeps oldest file
				foreach($times as $mtime => $filename)
				{
					if ($filename != $cacheName)
					{
						unlink($this->cacheFolder . DIRECTORY_SEPARATOR . $filename);
						break;
					}
				}
			}
		}
		return file_put_contents($cacheEntry, $data) !== false;
	}
}
