# Infrastructure & DevOps Runbook

This directory contains the Terraform configuration for provisioning the Sentinel Prime infrastructure in AWS `ap-south-1` and Kubernetes manifests for deployment.

## Prerequisites

1.  **AWS CLI**: Configured with credentials having Admin permissions.
2.  **Terraform**: v1.5.0+.
3.  **kubectl**: Configured to interact with EKS.
4.  **Helm**: For chart management.

## 1. Provisioning Infrastructure (Terraform)

**Strict Constraint**: All resources must be in `ap-south-1` (Mumbai) to comply with data residency laws.

### Initialize
```bash
cd infra/terraform
terraform init
```

### Plan
Create `terraform.tfvars` from the example:
```bash
cp terraform.tfvars.example terraform.tfvars
# EDIT terraform.tfvars with secure passwords!
```

Run plan:
```bash
terraform plan -out=tfplan
```

### Apply
```bash
terraform apply tfplan
```

**Key Resources Created:**
*   **VPC**: `sentinel-vpc-prod` (10.0.0.0/16)
*   **EKS**: `sentinel-eks-prod` (Nodes: t3.xlarge general, g4dn.xlarge AI)
*   **RDS**: `sentinel-core-db-prod` (PostgreSQL 15, Encrypted)
*   **S3**: `sentinel-evidence-vault-prod-ap-south-1` (KMS Encrypted)
*   **KMS**: `alias/sentinel-master-prod`

## 2. Kubernetes Deployment

### Connect to Cluster
```bash
aws eks update-kubeconfig --region ap-south-1 --name sentinel-eks-prod
```

### Deploy via Helm (Manual Test)
```bash
cd k8s/helm-chart/sentinel-prime
helm install sentinel-release . --namespace sentinel-prod --create-namespace
```

### Deploy via GitOps (ArgoCD)
Apply the Application manifest to your ArgoCD cluster:
```bash
kubectl apply -f k8s/argocd/application.yaml
```

## 3. Security Notes

*   **HSM/KMS**: The Evidence Vault uses envelope encryption via AWS KMS (`kms.tf`). Ensure the IAM role `sentinel-eks-node-role` has `kms:Decrypt` permissions on the master key.
*   **Database**: RDS password is set via variables. In production, rotate this immediately using AWS Secrets Manager.
*   **Network**: EKS nodes are in private subnets. Access is via Load Balancer or VPN only.
