<?php
$curl = curl_init($_GET['url']); 
curl_setopt($curl, CURLOPT_FAILONERROR, true); 
curl_setopt($curl, CURLOPT_FOLLOWLOCATION, true); 
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true); 
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false); 
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
header("Content-Type: " . curl_getinfo($ch, CURLINFO_CONTENT_TYPE));
echo curl_exec($curl);