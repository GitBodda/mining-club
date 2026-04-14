IMAGE=rg.fr-par.scw.cloud/blockmint-prod/app:latest
CONTAINER_ID=94955f6b-09ae-4bec-9465-bade0785f197

# Load credentials from .env (gitignored — never hardcode keys here)
-include .env
export SCW_ACCESS_KEY SCW_SECRET_KEY

deploy:
	@echo "🔨 Building Docker image..."
	docker build -t $(IMAGE) .
	@echo "📤 Logging into Scaleway Registry..."
	docker login rg.fr-par.scw.cloud -u $(SCW_ACCESS_KEY) -p $(SCW_SECRET_KEY)
	@echo "📤 Pushing Docker image..."
	docker push $(IMAGE)
	@echo "🚀 Deploying container..."
	scw container container deploy $(CONTAINER_ID)
	@echo "✅ Deployment finished!"