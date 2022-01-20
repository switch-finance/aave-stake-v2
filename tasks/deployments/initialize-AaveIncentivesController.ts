import { task } from 'hardhat/config';
import { eContractid } from '../../helpers/types';
import { waitForTx } from '../../helpers/misc-utils';
import {
  getAaveIncentivesControllerImpl,
  getAaveIncentivesControllerProxy,
} from '../../helpers/contracts-accessors';

const { AaveIncentivesController } = eContractid;

task(
  `initialize-${AaveIncentivesController}`,
  `Initialize the ${AaveIncentivesController} proxy contract`
)
  .addParam(
    'admin',
    `The address to be added as an Admin role in ${AaveIncentivesController} Transparent Proxy.`
  )
  .setAction(async ({ admin: aaveAdmin }, localBRE) => {
    await localBRE.run('set-dre');

    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }

    console.log(`\n- ${AaveIncentivesController} initialization`);

    const aaveIncentivesControllerImpl = await getAaveIncentivesControllerImpl();
    const aaveIncentivesControllerProxy = await getAaveIncentivesControllerProxy();

    console.log('\tInitializing AaveIncentivesController');

    const encodedInitializeAaveIncentivesController = aaveIncentivesControllerImpl.interface.encodeFunctionData(
      'initialize'
    );

    await waitForTx(
      await aaveIncentivesControllerProxy.functions['initialize(address,address,bytes)'](
        aaveIncentivesControllerImpl.address,
        aaveAdmin,
        encodedInitializeAaveIncentivesController
      )
    );

    console.log('\tFinished AaveIncentivesController and Transparent Proxy initialization');
  });
