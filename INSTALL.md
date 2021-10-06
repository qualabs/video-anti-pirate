# Deployment guide

To be able to deploy, you'll need to setup your local environment first.

# Deploying the KS and KM
## Local setup
Python 3.7 is needed to run and deploy the system. If you don't have this specific version, follow the steps below.

### Creating a Virtualenv (if you already have python3.7)
Start by creating a virtualenv:

    python3 -m venv venv

Activate the virtualenv:
    
    source venv/bin/activate

Install the requirements:

    pip3 install -r requirements.txt

### Creating a virtualenv (if you don't have python3.7)
The easiest way is to use Docker. Run:

    docker build . -t pywm

Then, run a shell with:
    
    docker run -it -v `pwd`:/root/code --rm pywm bash

And once inside the container:

    source root/venv/bin/activate

This will mount all the code in `/root/code`, and enable the virtualenv

You will have to setup the AWS credentials in the container:

     mkdir /root/.aws
     cat > /root/.aws/credentials << EOF
     [default]
     AWS_ACCESS_KEY_ID=XXXXX
     AWS_SECRET_ACCESS_KEY=XXXXX     
     EOF


### Setup zappa_settings.json
In both km and ks, modify `zappa_settings.json`
You have to change the s3 bucket name. You may change the region if you want. `profile_name` tells Zappa which local profile to use, this corresponds to the profile in your AWS credentials file.

If you need to setup ENV variables, do so in this file. See the READMEs on each folder for an explanation on available ENVs

## Deploying to the cloud
To deploy KM:
    
    cd km
    zappa deploy dev

To deploy KS:
    
    cd ks
    zappa deploy dev

Take note of the URLs returned from each step. The KM URL will be used in the MediaLive setup. The KS URL will be used in the integration with 3rd party backend and when building the frontend.

### Updates / delete
If you modify code and want to update an existing lambda, run `zappa update dev`.

If you want to remove the deployment, just run `zappa undeploy dev`.

# Preparing the frontend deploy
## Building
In the `front` folder, edit the .env file and provide the KS URL. After, run:

    npm install
    npm build

The `front/build` folder will contain the output.

This build will then be taken and used by the next step to be deployed to S3.


# Deploying IAMs, tables, and admin site

To deploy, you need to have your AWS credentials configured.
Then, cd into the `infra` folder and run:
    
    npm install
    cdk bootstrap
    cdk deploy

This will deploy:

- DynamoDB tables named wm-keys and wm-control. 
- The admin site
- IAM to use for the encryption

The deployment will output the URL for the admin site and the IAM you will need to use when setting up MediaPackage.

# Deploying the sample app
To deploy the sample app, first update `zappa_settings.json` with the URL for the KS server, then:
    
    cd sample_integration
    zappa deploy dev


# Streaming setup

## MediaLive
MediaLive should have an output group pointed to MediaPackage. 
You can follow AWS's tutorial: https://docs.aws.amazon.com/medialive/latest/ug/getting-started-tutorial.html

## MediaPackage
In MediaPackage, when you set up the Package encryption, make sure to select "Encrypt content".

**Important**: Only DASH is supported

The `resource ID` is used afterwards in the backend to identify this stream.

In `System IDs` use `1077efec-c0b2-4d02-ace3-3c1e52e2fb4b` (ClearKey's system ID).

In `URL` use the KS URL you got when deploying the KS.

In `Role ARN` use the IAM you got when deploying the AWS infrastructure.

In Additional configuration, lower the key rotation interval. Note that a lower setting will make the player do more requests.
