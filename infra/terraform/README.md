# Sentinel Prime Infrastructure

Terraform configuration for deploying Sentinel Prime to AWS `ap-south-1`.

## Prerequisites

1.  AWS CLI configured.
2.  Terraform v1.6+.
3.  Kubectl installed.

## Deployment Steps

1.  Initialize Terraform:
    ```bash
    terraform init
    ```

2.  Configure Variables:
    Copy the example file and edit it.
    ```bash
    cp terraform.tfvars.example terraform.tfvars
    ```
    **Important**: Set a strong `db_password`.

3.  Validate Configuration:
    ```bash
    terraform validate
    ```

4.  Plan Deployment:
    ```bash
    terraform plan -out=tfplan
    ```

5.  Apply Infrastructure:
    ```bash
    terraform apply tfplan
    ```

6.  Configure Kubectl:
    ```bash
    aws eks update-kubeconfig --region ap-south-1 --name <cluster_name>
    ```
