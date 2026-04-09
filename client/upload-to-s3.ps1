# Upload build to S3
# Make sure AWS CLI is installed and configured

$bucketName = "interview-app-frontend-anubhav"
$buildPath = ".\build"

Write-Host "Uploading to S3 bucket: $bucketName" -ForegroundColor Green

# Upload files
aws s3 sync $buildPath s3://$bucketName --delete

Write-Host "Upload complete!" -ForegroundColor Green
Write-Host "Visit: http://interview-app-frontend-anubhav.s3-website.eu-north-1.amazonaws.com/" -ForegroundColor Cyan
