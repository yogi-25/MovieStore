


docker tag test-movie:v0.0.44 992382663303.dkr.ecr.us-east-1.amazonaws.com

docker push 992382663303.dkr.ecr.us-east-1.amazonaws.com/test-movie:v0.0.44
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 992382663303.dkr.ecr.us-east-1.amazonaws.com




kubectl get svc -n staging



---steps
1.$ docker build -t movieapp:latest .

docker push movieapp:latest

kubectl apply -f deployment.yaml