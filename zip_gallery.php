<?php
/**
 * Class ZipGallery
 *
 * A representation of a gallery from a ZIP archive
 *
 * Copyright 2016, 2017, 2020 - TDSystem Thomas Dausner
 */
class ZipGallery extends ZipArchive
{

	protected $zipFilename;
	protected $zipStat;
	protected $cache;
	protected $cacheNamePrefix;
	protected $zip;
	protected $entries;
	protected $media;
	protected $iptcFields = [
	    '2#005' => 'title',
	    '2#010' => 'urgency',
	    '2#015' => 'category',
	    '2#020' => 'subcategories',
	    '2#025' => 'subject',
		'2#040' => 'specialInstructions',
	    '2#055' => 'cdate',
	    '2#080' => 'authorByline',
	    '2#085' => 'authorTitle',
	    '2#090' => 'city',
	    '2#095' => 'state',
	    '2#101' => 'country',
	    '2#103' => 'OTR',
	    '2#105' => 'headline',
	    '2#110' => 'source',
	    '2#115' => 'photoSource',
	    '2#116' => 'copyright',
	    '2#120' => 'caption',
	    '2#122' => 'captionWriter'
	];

	/**
     * Opens a ZIP file and scans it for contained files.
     *
     * @param string $zipFilename
     */
	public function __construct($zipFilename)
	{
		$this->entries = 0;
		$this->zipFilename = $zipFilename;
		$pathToZip = dirname(__FILE__) . DIRECTORY_SEPARATOR . $zipFilename;
		$this->zip = new ZipArchive;
		if ($this->zip->open($pathToZip) == true)
		{
			$this->zipStat = stat($pathToZip);
			$this->entries = $this->zip->numFiles;
			$this->cache = new ZipGalleryCache;
			$this->cacheNamePrefix = ltrim($this->zipFilename, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
			$this->cache->setIgnorePattern('/\.json$/');
		}
	}

	public function  __destruct()
	{
	}

    /**
     * Get file identified by file name from ZIP archive.
     * Returns data or FALSE.
     *
     * @param string filename
     * @return string
     */
	public function getFromZip($filename)
	{
		$data = FALSE;

		if ($this->entries > 0)
		{
			$data = $this->zip->getFromName($filename);
		}
		return $data;
	}
	/**
     * Get file identified by file name from cache.
     * Returns data or null.
     *
     * @param string filename
     * @return null|string
     */
	private function getFromCache($filename)
	{
		$data = null;

		if ($this->entries > 0)
		{
			$data = $this->cache->getEntry($this->zipStat['mtime'], $this->cacheNamePrefix . $filename);
		}
		return $data;
	}
	/**
     * Get entries from ZIP archive as JSON array
     * 
     * @return string
     */
	public function getInfo()
	{
		$info = null;
		if ($this->entries > 0)
		{
			// ZIP file is open, look for cached info entry
			if (($info = $this->getFromCache('info.json')) === null)
			{
				// ZIP file info is not in cache, generate and set into cache
				$entryNum = 0;
				$fileInfo = new finfo(FILEINFO_NONE);
				for ($i = 0; $i < $this->zip->numFiles; $i++)
				{
					$stat = $this->zip->statIndex($i);
					$filename = $stat['name'];

					if (preg_match('/jpe?g$/i', $filename) === 1)
					{
						// ZIP entry is relevant file
						$data = $this->zip->getFromName($filename);
						// init decoded IPTC fields with pseudo 'filename'
						$iptcDecoded = [
							'filename' => $filename
						];
						if (($exif = exif_read_data('data://image/jpeg;base64,'.base64_encode($data), null, true)) !== false)
						{
							getimagesizefromstring($data, $imgInfo);
							if (isset($imgInfo['APP13']))
							{
								$iptc = iptcparse($imgInfo['APP13']);
								foreach ($iptc as $key => $value)
								{
									$idx = isset($this->iptcFields[$key]) ? $this->iptcFields[$key] : $key;
									$iptcDecoded[$idx] = $value;
								}
							}
						}
						$exifData = [];
						foreach ($exif as $exKey => $exValue)
						{
							foreach ($exValue as $key => $value)
							{
								if (is_array($value) || $fileInfo->buffer($value) != 'data')
								{
									$exifData[$exKey][$key] = $value;
								}
							}
						}

						$this->media[$entryNum++] = [
							'name' => $filename,
							'exif' => $exifData,
							'iptc' => $iptcDecoded
						];
					}

				}
				$jsonOptions = 0;
				if (@defined(JSON_PARTIAL_OUTPUT_ON_ERROR))
				{
					$jsonOptions = JSON_PARTIAL_OUTPUT_ON_ERROR;
				}
				$info = json_encode($this->media, $jsonOptions);
				$this->cache->setEntry($this->cacheNamePrefix . 'info.json', $info);
			}
		}
		return $info;
	}
	/**
     * Generate thumb from file identified by file name.
     * Outputs thumbnail and returns true or false in case of error.
     *
     * @param string filename
     * @param int new_width
     * @param int new_height
     * @return string
     */
	public function getThumb($filename, $new_width, $new_height)
	{
		$tnFilename = $new_width . 'x' . $new_height . '/' . $filename;
		$data = $this->getFromCache($tnFilename);
		if ($data === null)
		{
			// not in cache, create
			$data = $this->getFromZip($filename);
			if ($data != null)
			{
				$im = imagecreatefromstring($data);
				list($width, $height) = getimagesizefromstring($data);
				if ($new_width < 0)
				{
					//
					// fixed height, flexible width
					//
					$new_width = intval($new_height * $width / $height);
				}
				$x = $y = 0;
				if ($new_width == $new_height)
				{
					//
					// square thumbnail
					//
					if ($width > $height)
					{
						$x = intval(($width - $height ) / 2);
						$width = $height;
					}
					else
					{
						$y = intval(($height - $width ) / 2);
						$height = $width;
					}
				}
				$thumbNail = imagecreatetruecolor($new_width, $new_height);
				imagecopyresampled($thumbNail, $im, 0, 0, $x, $y, $new_width, $new_height, $width, $height);

				ob_start();
				if (imagejpeg($thumbNail, null))
				{
					$data = ob_get_contents();
					$this->cache->setEntry($this->cacheNamePrefix . $tnFilename, $data);
				}
				ob_end_clean();
			}
		}
		return $data;
	}
}