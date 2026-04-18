$env:JAVA_HOME = "E:\jdk\jdk-17.0.10+7"
$env:PATH = "E:\jdk\jdk-17.0.10+7\bin;E:\;" + $env:PATH
.\gradlew.bat @args --no-daemon
