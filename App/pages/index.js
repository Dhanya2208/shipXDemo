import React, { useState, useEffect } from 'react';
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticatedFetch } from "@shopify/app-bridge-utils";
import { Frame, Loading,  Card, EmptyState } from '@shopify/polaris';

const Index = () => {
  const app = useAppBridge();

  const [isFetchingSetup, setIsFetchingSetup] = useState(true);
  const [setup, setSetup] = useState({});

  const getSetup = async () => {
    authenticatedFetch(app)(`${HOST}/api/setup`, { method: 'GET' })
      .then(response => response.json())
      .then(setup => {
        console.log("getSetup => setup", setup);
        setSetup(setup);
        setIsFetchingSetup(false);
        console.log(setup);
      }).catch(error => console.log('Error while fetching setup', error));
  }

  useEffect(() => {
    if (isFetchingSetup) {
      getSetup();
    }
  }, [isFetchingSetup]);

  if (isFetchingSetup) {
    return (
      <div style={{ height: '100px' }}>
        <Frame>
          <Loading />
        </Frame>
      </div>)
  }
  return (
    <Card sectioned>
      <EmptyState
        heading={`Shop - ${setup.shop.name}`}
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png">
        <p>{`Contact - ${setup.shop.contactEmail}`}</p>
      </EmptyState>
    </Card>
  )
}

export default Index;
